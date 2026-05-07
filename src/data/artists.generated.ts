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
    "name": "Killmer",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://killmer.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0035077765_10.jpg",
    "bio": "Killmer is a 3-piece rock band that packages the intensity of punk rock, the soul of blues, and the loud riffs of rock & roll into their unique sound. With dual lead vocalists, they create rich harmonies over energetic rhythmic grooves. For fans of White Denim, Ty Segall, King Gizzard and the Lizard Wizard, and Wand. ... more",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://killmer.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "primo!",
        "type": "album",
        "url": "https://killmer.bandcamp.com/album/primo"
      },
      {
        "title": "Permafrown",
        "type": "track",
        "url": "https://killmer.bandcamp.com/track/permafrown-2"
      },
      {
        "title": "VHS",
        "type": "track",
        "url": "https://killmer.bandcamp.com/track/vhs"
      },
      {
        "title": "Lost and Profound",
        "type": "album",
        "url": "https://killmer.bandcamp.com/album/lost-and-profound"
      },
      {
        "title": "Permafrown (Demo)",
        "type": "track",
        "url": "https://killmer.bandcamp.com/track/permafrown-demo"
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
