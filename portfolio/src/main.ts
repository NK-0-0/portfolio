import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Register ALL Three.js objects in the angular-three catalogue so they
// can be used as <ngt-*> elements in templates across the scene graph.
import { extend } from 'angular-three';
import * as THREE from 'three';
extend(THREE);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
