<div align="center">
  <img width="500" alt="Promo" src="Large Promo.png">
  
  <p class="body">Send picture from android to mac? Large file over 2gb from pc to pc?</p>
  <p>AirDash handles it all securely and free.</p>
        
  <img width="400" alt="Promo" src="promo.png">

</div>

****
<div align="center">
  
  <p>Download for</p>
  
  <img src="https://img.shields.io/badge/-Android-3DDC84?style=for-the-badge&logo=android&logoColor=ffffff"/>
  <img src="https://img.shields.io/badge/-iOS-007aff?style=for-the-badge&logo=ios&logoColor=ffffff"/>
  <img src="https://img.shields.io/badge/-MacOS-007aff?style=for-the-badge&logo=apple&logoColor=ffffff"/>
  <img src="https://img.shields.io/badge/-Windows-00adef?style=for-the-badge&logo=windows&logoColor=ffffff"/>
</div>

****

## Getting Started

- `npm install`
- `npm run start-web` For web app
- `npm start` For desktop app

## Architecture

AirDash is built with [PeerJS](https://peerjs.com) which sends files through WebRTC. 

The web app is built as a [PWA](https://developers.google.com/web/progressive-web-apps) which enables users to add the on Android and use some native features such as the Android share menu.

The desktop app is built with [electronjs](https://www.electronjs.org).

#### Web architecture

Page load: index.html -> app.js -> registers sw.js service worker

## Deploy and build

- `npm run deploy-web`
- `npm run deploy-desktop`

## PeerJS Server

Uses a custom peerjs server setup at peerjs.flown.io. Its setup with the default suggested "docker run -p 9000:9000 -d peerjs/peerjs-server" together with nginx. 

## Contributing
Pull requests are welcome. Go to [FindCollab](https://findcollabs.com/project/7BK81zF3mZTpT0jjQ2hQ) to see features and improvements in development.
