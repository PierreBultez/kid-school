import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'profiles', renderMode: RenderMode.Client },
  { path: 'play', renderMode: RenderMode.Client },
  { path: 'play/symmetry-spotter', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
