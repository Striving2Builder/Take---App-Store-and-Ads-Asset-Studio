declare module "google-play-scraper" {
  type AppOptions = {
    appId: string;
    lang?: string;
    country?: string;
  };

  type AppResult = {
    appId?: string;
    title?: string;
    summary?: string;
    description?: string;
    developer?: string;
    genre?: string;
    icon?: string;
    headerImage?: string;
    screenshots?: string[];
    score?: number;
    ratings?: number;
    url?: string;
  };

  const gplay: {
    app: (opts: AppOptions) => Promise<AppResult>;
  };

  export default gplay;
}
