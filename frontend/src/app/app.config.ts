import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { LocalStorageDataSource } from './core/local-storage-data-source';
import { MasterDeskDataSource } from './services/data-source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: MasterDeskDataSource, useClass: LocalStorageDataSource },
  ]
};
