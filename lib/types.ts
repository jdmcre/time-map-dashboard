export type SunEventRecord = {
  date: string;
  sunrise_local: string;
  sunset_local: string;
  sunrise_utc: string;
  sunset_utc: string;
  day_length_seconds: number;
};

export type Prefs = {
  day?: boolean;
  age?: boolean;
  clock?: boolean;
  year?: boolean;
  ping?: boolean;
};

export type NextSunEvent = {
  type: "Sunrise" | "Sunset";
  when: Date;
  altType: "Sunrise" | "Sunset";
  altWhen: Date;
};
