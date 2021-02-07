<template>
  <div class="mappane">
    <h2>Amazon location service with Vue</h2>
    <div id="map"></div>
  </div>
</template>

<script>
/* eslint no-unused-vars: 0, no-undef: 0 */
import mapboxgl from "mapbox-gl";

import { AWS } from "aws-sdk";
import { Auth } from 'aws-amplify';
import { Signer } from "@aws-amplify/core";
import Location from "aws-sdk/clients/location";
import awsconfig from '../aws-exports';

export default {
  name: "MapPane",
  data() {
    return {
      credentials: null
    };
  },
  mounted: function() {
    this.mapCreate();
  },
  methods: {
    async mapCreate() {
      const credentials = await Auth.currentCredentials();
      this.credentials = credentials;

      const map = new mapboxgl.Map({
        container: "map",
        center: [-123.1187, 49.2819], // initial map centerpoint
        // center: [34.6989, 137.7000],
        zoom: 10, // initial map zoom
        style: "MyMap",
        transformRequest: this.transformRequest,
      });

      console.log({map});

      // コントロール関係表示
      map.addControl(new mapboxgl.NavigationControl(), "top-left");
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
    }
  }
}
</script>

<style scoped>
#map {
  height: 100vh;
}
</style>