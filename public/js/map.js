// const mapToken ="pk.eyJ1Ijoia2hhbmxhbnlhazY5IiwiYSI6ImNseXU3Z2dmeDB4dmMya29wbTY4cHg2cHAifQ.pUTMiVi_9k7fOd2coCh1ng" 
 mapboxgl.accessToken = mapToken;
      const map = new mapboxgl.Map({
          container: 'map', // container ID
          center: listing.geometry.coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
          zoom: 9 // starting zoom
      });

    
const marker = new mapboxgl.Marker({color: "red"})

    .setLngLat(listing.geometry.coordinates)
    .setPopup(new mapboxgl.Popup({offset:25})

    .setHTML(`<h4>${listing.location}</h4><p>Exact location after booking</p>`))
    .addTo(map);
