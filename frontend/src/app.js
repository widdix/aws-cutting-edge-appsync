import { AWSAppSyncClient } from 'aws-appsync'
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from "graphql-tag";
import Vue from 'vue'

const REGION = 'eu-west-1';
const APPSYNC_URI = 'https://v233izxeofbg7mpx6pslew2wwm.appsync-api.eu-west-1.amazonaws.com/graphql';
const APPSYNC_APIKEY = 'da2-7scjjscmlzcqtgkjm4kfv5czaa';


const httpLink = createHttpLink({
  uri: APPSYNC_URI,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      'x-api-key': APPSYNC_APIKEY
    }
  }
});

const client = new AWSAppSyncClient({
  url: APPSYNC_URI,
  region: REGION,
  auth: {
    type: 'API_KEY',
    apiKey: APPSYNC_APIKEY
  }
}, {
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    }
  }
});

var observable = client.subscribe({
    query: gql`
        subscription {
          voted
        }
      `
  });

console.log(observable);
observable.subscribe(data => {
  console.log("REFRESH");
  votingresults.fetchData()}
);


var votingresults = new Vue({
  el: '#votingresults',
  data () {
    return {
      items: []
    }
  },
  created () {
    this.fetchData();
  },
  methods: {
    fetchData () {
      console.log("REFRESH fetchData");
      client
        .query({
          query: gql`
            {
              getVotingResults(nextToken: null) {
                items {
                  service
                  upvotes
                }
                nextToken
              }
            }
          `
        })
        .then(result => {
          console.log(result);
          result.data.getVotingResults.items.sort((a, b) => b.upvotes - a.upvotes)
          this.items = result.data.getVotingResults.items;
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
});

var vote = new Vue({
  el: '#vote',
  data () {
    return {
      items: null,
      service: null
    }
  },
  created () {
    this.fetchData()
  },
  methods: {
    vote() {
      client
        .mutate({
          mutation: gql`
            mutation {
              vote(service: ${this.service})
            }
          `
        })
        .then(result => {
          console.log(result);
         // votingresults.fetchData();
        })
        .catch(err => {
          console.log(err);
        });
    },
    fetchData () {
      console.log('fetchData()');
      client
        .query({
          query: gql`
            {
              getServices(nextToken: null) {
                items 
                nextToken
              }
            }
          `
        })
        .then(result => {
          console.log(result.data.getServices.items);
          this.items = result.data.getServices.items.sort();
          this.service = result.data.getServices.items[0];
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
});

