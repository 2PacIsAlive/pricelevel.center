<template>
  <v-app :light="!dark" :dark="dark">
    <v-toolbar fixed app>
      <v-spacer/>
      <v-toolbar-title>
        order book combinator
      </v-toolbar-title>
      <v-spacer/>
      <v-btn @click="toggleDark" flat icon>
        <v-icon v-if="dark">brightness_5</v-icon>
        <v-icon v-else>brightness_4</v-icon>
      </v-btn>
    </v-toolbar>
    <v-container v-if="ready" class="mt-5">
      <router-view/>
    </v-container>
    <v-container v-else fill-height>
      <v-layout row wrap align-center>
        <v-flex class="text-xs-center">
          <v-progress-circular :size="128" :width="2" indeterminate/>
        </v-flex>
      </v-layout>
    </v-container>
    <v-footer fixed app>
      <v-spacer/>
      <span class="mr-2">socket status: </span>
      <span v-if="connected" class="mr-3 green--text">connected</span>
      <span v-else class="mr-3 red--text">disconnected</span>
    </v-footer>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data () {
    return {
      dark: true
    }
  },
  methods: {
    toggleDark: function () {
      this.dark = !this.dark
    }
  },
  computed: {
    ...mapState([
      'connected',
      'exchanges'
    ]),
    ready () {
      return this.connected && this.exchanges.length > 0
    }
  },
  name: 'App'
}
</script>

<style>
  * {
    font-family: 'Inconsolata', monospace;
  }
</style>
