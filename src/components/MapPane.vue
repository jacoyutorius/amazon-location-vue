<template>
  <div class="mappane">
    <h2>Amazon location service with Vue</h2>

    <div class="search">
      <form>
        <input type="text" v-model="search.place" placeholder="Search place here">
        <button type="button" @click="getCoding">Search</button>
      </form>
    </div>
    <div id="map"></div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";

import { Auth } from 'aws-amplify';
import { Signer } from "@aws-amplify/core";
import Location from "aws-sdk/clients/location";
import awsconfig from '../aws-exports';

export default {
  name: "MapPane",
  data() {
    return {
      credentials: null,
      search: {
        place: ""
      },
      map: null,
      currentPosition: {
        longitude: 143.767125, // default
        latitude: 38.681236
      },
      location: []
    };
  },
  mounted: async function() {
    const currentPosition = await this.getCurrentPosition();
    this.currentPosition = {
      longitude: currentPosition.coords.longitude,
      latitude: currentPosition.coords.latitude,
    };

    this.mapCreate();
  },
  computed: {
    viewPort: function() {
      return [this.currentPosition.longitude, this.currentPosition.latitude];
    }
  },
  methods: {
    getCurrentPosition(options) {
      if (!navigator.geolocation) {
        alert('このブラウザ/OSではジオロケーションに対応していません');
        return null;
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })
    },
    async mapCreate() {
      const credentials = await Auth.currentCredentials();
      this.credentials = credentials;

      this.map = new mapboxgl.Map({
        container: "map",
        center: this.viewPort,
        zoom: 10.5,
        style: "MyMap",
        transformRequest: this.transformRequest,
      });

      // コントロール関係表示
      this.map.addControl(
        new mapboxgl.NavigationControl(),
        "top-left");

      // マーカー表示
      new mapboxgl.Marker({
          color: "red"
        }).setLngLat(this.viewPort)
          .addTo(this.map);
    },
    transformRequest(url, resourceType) {
      if (resourceType === "Style" && !url.includes("://")) {
        // resolve to an AWS URL
        url = `https://maps.geo.${awsconfig.aws_project_region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
      }

      if (url.includes("amazonaws.com")) {
        // only sign AWS requests (with the signature as part of the query string)
        return {
          url: Signer.signUrl(url, {
            access_key: this.credentials.accessKeyId,
            secret_key: this.credentials.secretAccessKey,
            session_token: this.credentials.sessionToken,
          }),
        };
      }

      return { url };
    },
    async getCoding() {
      const client = new Location({
        credentials: this.credentials,
        region: awsconfig.aws_project_region
      });
      const params = {
        IndexName: "explore.place",
        Text: this.search.place
      };

      const data = await client.searchPlaceIndexForText(params)
                               .promise()
                               .catch(e => console.log(e));

      // TODO: geolocationにて取得した位置情報をcenterにして地図を再描画する方法がわかんないー
      if (data) {
        const coordinates = data.Results[0].Place.Geometry.Point;

        this.currentCredentials = {
          longitude: coordinates[0],
          latitude: coordinates[1]
        }

        new mapboxgl.Marker({
          color: "blue",
          draggable: true
        }).setLngLat([coordinates[0], coordinates[1]])
          .addTo(this.map);

        // console.log({marker});
      }
    }
  }
}
</script>

<style scoped>
#map {
  height: 100vh;
}
</style>