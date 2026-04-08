import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Forces every same-origin API call to send cookies (XSRF + session)
 * which is required by Sanctum SPA authentication.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/sanctum')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
