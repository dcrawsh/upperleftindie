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
  },
  {
    "name": "Bonus Room",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://bonusroomband.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0035689173_10.jpg",
    "bio": "Upcoming Shows - \"BUNK\" EP Release Show!!! November 7th @ Alberta Street Pub with Animal Eyes and Ghost Frog BEN-CHRIS-DERRIN-ERIK-WES Feel good band of the summer. Portland, Oregon ... more",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://bonusroomband.bandcamp.com/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/bonusroom_band/"
      }
    ],
    "releases": [
      {
        "title": "Blessed Be",
        "type": "track",
        "url": "https://bonusroomband.bandcamp.com/track/blessed-be"
      },
      {
        "title": "Riot Gear",
        "type": "album",
        "url": "https://bonusroomband.bandcamp.com/album/riot-gear"
      },
      {
        "title": "Use 2",
        "type": "track",
        "url": "https://bonusroomband.bandcamp.com/track/use-2"
      },
      {
        "title": "Phoenix",
        "type": "track",
        "url": "https://bonusroomband.bandcamp.com/track/phoenix"
      },
      {
        "title": "Trouble (Uh-Oh)",
        "type": "track",
        "url": "https://bonusroomband.bandcamp.com/track/trouble-uh-oh"
      }
    ]
  },
  {
    "name": "The Waysides",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://thewaysidesmusic.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0038268184_10.jpg",
    "bio": "The Waysides write visceral, jangle guitar-infused indie rock that blends lush dream-pop vocals with the raw spirit and DIY ethos of punk. Their sophomore album, Elsewhere, explores the journey through loss and grief, delivering a poignant mix of sorrow, acceptance, and hope, all wrapped in their evocative and electrifying sound. ... more",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://thewaysidesmusic.bandcamp.com/"
      },
      {
        "label": "Facebook",
        "url": "https://www.facebook.com/itsthewaysides"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/the.waysides/"
      }
    ],
    "releases": [
      {
        "title": "The Witch (Alternate Version)",
        "type": "track",
        "url": "https://thewaysidesmusic.bandcamp.com/track/the-witch-alternate-version"
      },
      {
        "title": "The Witch",
        "type": "track",
        "url": "https://thewaysidesmusic.bandcamp.com/track/the-witch"
      },
      {
        "title": "Only Light",
        "type": "track",
        "url": "https://thewaysidesmusic.bandcamp.com/track/only-light"
      },
      {
        "title": "Elsewhere",
        "type": "album",
        "url": "https://thewaysidesmusic.bandcamp.com/album/elsewhere"
      },
      {
        "title": "Golden One",
        "type": "track",
        "url": "https://thewaysidesmusic.bandcamp.com/track/golden-one"
      },
      {
        "title": "Surfacing",
        "type": "track",
        "url": "https://thewaysidesmusic.bandcamp.com/track/surfacing"
      }
    ]
  }
];
