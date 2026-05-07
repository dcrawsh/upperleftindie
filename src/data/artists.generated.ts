export type ArtistLink = {
  label: string;
  url: string;
};

export type ArtistRelease = {
  title: string;
  type: "album" | "track";
  released?: string;
  url: string;
};

export type Artist = {
  name: string;
  location?: string;
  bandcampUrl: string;
  image?: string;
  bio?: string;
  tags: string[];
  links: ArtistLink[];
  releases: ArtistRelease[];
};

export const artists: Artist[] = [
  {
    "name": "Candy Cigarettes",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://candycigsmusic.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0041258213_10.jpg",
    "bio": "Lane Mueller.",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://candycigsmusic.bandcamp.com/"
      },
      {
        "label": "CandyCigs.com",
        "url": "http://CandyCigs.com"
      },
      {
        "label": "Facebook",
        "url": "http://facebook.com/candycigs"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/candy_cigs/"
      }
    ],
    "releases": [
      {
        "title": "Horse Lungs",
        "type": "album",
        "url": "https://candycigsmusic.bandcamp.com/album/horse-lungs"
      },
      {
        "title": "Candy Cigarettes",
        "type": "album",
        "url": "https://candycigsmusic.bandcamp.com/album/candy-cigarettes"
      },
      {
        "title": "Stockholm",
        "type": "track",
        "url": "https://candycigsmusic.bandcamp.com/track/stockholm"
      }
    ]
  },
  {
    "name": "time theft",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://timetheft.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0042060624_10.jpg",
    "bio": "Medium-Soft rock band from Portland, Oregon.",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://timetheft.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "All Filler No Killer",
        "type": "album",
        "url": "https://timetheft.bandcamp.com/album/all-filler-no-killer"
      },
      {
        "title": "Past Couple Years",
        "type": "album",
        "url": "https://timetheft.bandcamp.com/album/past-couple-years"
      },
      {
        "title": "Live At Kelly's",
        "type": "album",
        "url": "https://timetheft.bandcamp.com/album/live-at-kellys"
      },
      {
        "title": "Benny",
        "type": "track",
        "url": "https://timetheft.bandcamp.com/track/benny"
      },
      {
        "title": "Ponyboy",
        "type": "track",
        "url": "https://timetheft.bandcamp.com/track/ponyboy"
      }
    ]
  }
];
