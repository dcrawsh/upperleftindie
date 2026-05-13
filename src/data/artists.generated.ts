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
  submittedGenre?: string;
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
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
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
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
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
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
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
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
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
  },
  {
    "name": "Candy Cigarettes",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://candycigsmusic.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0041258213_10.jpg",
    "bio": "Lane Mueller.",
    "submittedGenre": "Indie Pop",
    "tags": [
      "Indie Pop"
    ],
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
    "name": "GVTH DVDDY",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://gvthdvddy.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a3653743646_10.jpg",
    "bio": "K.Robinson J. Endicott GVTHDVDDY.com",
    "submittedGenre": "Alternative",
    "tags": [
      "Alternative"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://gvthdvddy.bandcamp.com/"
      },
      {
        "label": "gvthdvddy.com",
        "url": "http://gvthdvddy.com"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/gvth_dvddy"
      },
      {
        "label": "Facebook",
        "url": "https://www.facebook.com/MOCKHEAVEN/"
      }
    ],
    "releases": [
      {
        "title": "Doom Kitty",
        "type": "album",
        "url": "https://gvthdvddy.bandcamp.com/album/doom-kitty/"
      }
    ]
  },
  {
    "name": "Uncanny Valley Girls",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://uncannyvalleygirlspdx.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0037806411_10.jpg",
    "bio": "Portland Oregon スケバン rocking roll from Cap Hill in Sea Apple, Washington. Cadence Welles (She/Her) - Vocals, guitar Coree Hogan (They/Them) - Lead guitar Juliet Terril (She/Her) - Bass Ryan Cripps (She/Her) - Drums ... more",
    "submittedGenre": "Punk",
    "tags": [
      "Punk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://uncannyvalleygirlspdx.bandcamp.com/"
      },
      {
        "label": "Twitter",
        "url": "https://twitter.com/uncannyvgirlsOR"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/uncannyvalleygirlspdx/"
      }
    ],
    "releases": [
      {
        "title": "Hear Me, Earth Astronaut",
        "type": "album",
        "url": "https://uncannyvalleygirlspdx.bandcamp.com/album/hear-me-earth-astronaut"
      },
      {
        "title": "Will to Resign",
        "type": "track",
        "url": "https://uncannyvalleygirlspdx.bandcamp.com/track/will-to-resign-3"
      }
    ]
  },
  {
    "name": "Shaylee",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://shayleeband.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a0183651852_10.jpg",
    "bio": "Power Pop / Post-Rock from the PNW booking: shayleeband@gmail.com",
    "submittedGenre": "Post-Rock",
    "tags": [
      "Post-Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://shayleeband.bandcamp.com/"
      },
      {
        "label": "Instagram",
        "url": "http://instagram.com/shayleeband"
      },
      {
        "label": "Facebook",
        "url": "http://facebook.com/shayleeband"
      }
    ],
    "releases": [
      {
        "title": "L-Shaped Room EP",
        "type": "album",
        "url": "https://shayleeband.bandcamp.com/album/l-shaped-room-ep/"
      }
    ]
  },
  {
    "name": "An Invisible Jet",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://aninvisiblejet.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0039684643_10.jpg",
    "bio": "An Invisible Jet is a Portland, OR music project started by Matt Blum in 2020. An Invisible Jet focuses on guitar-driven music deriving its influences from 90's indie rock, metal, post-punk, and prog. Their signature sound typically involves an intricate guitar-riff at the heart of the song, with shifting dynamics that lead the listener down a rabbit hole (or k hole). ... more",
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://aninvisiblejet.bandcamp.com/"
      },
      {
        "label": "allmylinks.com",
        "url": "https://allmylinks.com/invisiblejet"
      }
    ],
    "releases": [
      {
        "title": "Welcome to the Warzone",
        "type": "album",
        "url": "https://aninvisiblejet.bandcamp.com/album/welcome-to-the-warzone"
      },
      {
        "title": "The Gulf of Mexico",
        "type": "track",
        "url": "https://aninvisiblejet.bandcamp.com/track/the-gulf-of-mexico"
      },
      {
        "title": "The Bottom of a Knife",
        "type": "track",
        "url": "https://aninvisiblejet.bandcamp.com/track/the-bottom-of-a-knife"
      },
      {
        "title": "4 am at the country club",
        "type": "album",
        "url": "https://aninvisiblejet.bandcamp.com/album/4-am-at-the-country-club"
      },
      {
        "title": "An Invisible Album for My Invisible Friends",
        "type": "album",
        "url": "https://aninvisiblejet.bandcamp.com/album/an-invisible-album-for-my-invisible-friends"
      }
    ]
  },
  {
    "name": "Essie and The Hum",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://essieandthehum.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a4149136458_10.jpg",
    "bio": "Essie and The Hum craft ethereal indie-folk rock shaped by the magic of live performance. Based in Portland, OR, their sound drifts from intimate, slow-burn ballads to full-throttle rock moments, pulling listeners into a wormhole they won’t want to leave. ... more",
    "submittedGenre": "Indie Folk",
    "tags": [
      "Indie Folk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://essieandthehum.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Live at Clay St. Studios",
        "type": "album",
        "url": "https://essieandthehum.bandcamp.com/album/live-at-clay-st-studios/"
      }
    ]
  },
  {
    "name": "Frontier Medicine",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://hearfrontiermedicine.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a3435300719_10.jpg",
    "bio": "Frontier Medicine are a music recording duo based in Portland, Oregon formed by Jackson Conrad and Jetamio Kennedy. Frontier Medicine’s sound represents a fresh interpretation of nostalgia, with elements of folk, soul, grunge, Americana, and progressive rock. Drawing from a multitude of influences, their sound is best described simply as “rock and roll.” ... more",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://hearfrontiermedicine.bandcamp.com/"
      },
      {
        "label": "hearfrontiermedicine.com",
        "url": "http://hearfrontiermedicine.com"
      }
    ],
    "releases": [
      {
        "title": "Frontier Medicine",
        "type": "album",
        "url": "https://hearfrontiermedicine.bandcamp.com/album/frontier-medicine/"
      }
    ]
  },
  {
    "name": "blond-noise",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://blond-noise.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a1979534463_10.jpg",
    "bio": "blond-noise is a singer-songwriter turned sound artist/producer who creates experimental alternative and electronic music. Their work blends voice, instrumentation, and field recordings into immersive, textural compositions and is often accompanied by their own multimedia visual and video art. ... more",
    "submittedGenre": "Experimental",
    "tags": [
      "Experimental"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://blond-noise.bandcamp.com/"
      },
      {
        "label": "YouTube",
        "url": "https://www.youtube.com/@blond-noise"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/blond_noise/"
      },
      {
        "label": "phenomenalcage.substack.com",
        "url": "https://phenomenalcage.substack.com"
      }
    ],
    "releases": [
      {
        "title": "home",
        "type": "track",
        "url": "https://blond-noise.bandcamp.com/track/home/"
      }
    ]
  },
  {
    "name": "Long Deer",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://longdeer.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0037215591_10.jpg",
    "bio": "Somewhere in the woods of the Pacific North West. They are compelled to play 1000 shows. FoLlOw",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://longdeer.bandcamp.com/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/theelongdeer"
      },
      {
        "label": "YouTube",
        "url": "https://youtube.com/@longestdeer?si=vZGqnr7jMwGxJ3Gc"
      }
    ],
    "releases": [
      {
        "title": "Compulsive Thoughts",
        "type": "album",
        "url": "https://longdeer.bandcamp.com/album/compulsive-thoughts"
      },
      {
        "title": "Road Head",
        "type": "track",
        "url": "https://longdeer.bandcamp.com/track/road-head"
      },
      {
        "title": "I Bleed You",
        "type": "track",
        "url": "https://longdeer.bandcamp.com/track/i-bleed-you"
      },
      {
        "title": "Be Careful With Deuce",
        "type": "album",
        "url": "https://longdeer.bandcamp.com/album/be-careful-with-deuce"
      },
      {
        "title": "Shadow Man",
        "type": "track",
        "url": "https://longdeer.bandcamp.com/track/shadow-man"
      }
    ]
  },
  {
    "name": "Orbit 17",
    "location": "San Francisco, California",
    "bandcampUrl": "https://orbit17.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a2366914491_10.jpg",
    "bio": "Orbit 17 weaves catchy melodies, funky rhythms and hypnotic grooves into intricate electro-rock.",
    "submittedGenre": "Electronic",
    "tags": [
      "Electronic"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://orbit17.bandcamp.com/"
      },
      {
        "label": "SoundCloud",
        "url": "https://soundcloud.com/orbit17music"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/orbit17music/"
      },
      {
        "label": "Twitter",
        "url": "https://twitter.com/Orbit17music"
      }
    ],
    "releases": [
      {
        "title": "Bonfires",
        "type": "album",
        "url": "https://orbit17.bandcamp.com/album/bonfires/"
      }
    ]
  },
  {
    "name": "The Upkeeps",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://theupkeeps.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0025926557_10.jpg",
    "bio": "\"The Upkeeps are one of the most entertaining bands on the Portland rock scene today. From catchy hooks to their signature look, wild gestures, and non-stop crowd interaction, The Upkeeps play every show like a sold-out arena set.\" - PDX Presents SYE VILES- VOCALS/GUITAR AARON BRIXTON- LEADS OLIVER SWEET- BASS KURT DOPAMINE- DRUMS ... more",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://theupkeeps.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Voices The UpKeeps",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/voices"
      },
      {
        "title": "I Want You Around The UpKeeps",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/i-want-you-around"
      },
      {
        "title": "Hear Me Out",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/hear-me-out"
      },
      {
        "title": "A Girl I Used To Know",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/a-girl-i-used-to-know"
      },
      {
        "title": "Secrets",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/secrets"
      },
      {
        "title": "Down N' Out",
        "type": "track",
        "url": "https://theupkeeps.bandcamp.com/track/down-n-out"
      }
    ]
  },
  {
    "name": "fields of silver",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://fieldsofsilver.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a4172428797_10.jpg",
    "bio": "grunge-y folk from the PNW",
    "submittedGenre": "Folk",
    "tags": [
      "Folk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://fieldsofsilver.bandcamp.com/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/fieldsofsilverband/"
      },
      {
        "label": "fieldsofsilver.net",
        "url": "http://fieldsofsilver.net"
      }
    ],
    "releases": [
      {
        "title": "delicate flowers & bloody teeth",
        "type": "album",
        "url": "https://fieldsofsilver.bandcamp.com/album/delicate-flowers-bloody-teeth/"
      }
    ]
  },
  {
    "name": "The Quick & Easy Boys",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://thequickandeasyboys.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0037450242_10.jpg",
    "bio": "The Quick & Easy Boys are a power-trio from Portland, OR. They play rock and roll...and they do it well.",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://thequickandeasyboys.bandcamp.com/"
      },
      {
        "label": "thequickandeasyboys.com",
        "url": "http://www.thequickandeasyboys.com"
      },
      {
        "label": "Facebook",
        "url": "http://facebook.com/thequickandeasyboys"
      },
      {
        "label": "itunes.apple.com",
        "url": "https://itunes.apple.com/us/artist/the-quick-easy-boys/id371514335"
      },
      {
        "label": "YouTube",
        "url": "http://YouTube.com/thequickandeasyboys"
      }
    ],
    "releases": []
  },
  {
    "name": "Terrible Pop",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://terriblepop.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0040770732_100.png\",\"https_url\":\"https://f4.bcbits.com/img/0040770732_100.png\",\"format\":100,\"width\":975,\"height\":180},\"paypal_image\":{\"image_id\":40770732,\"url\":\"https://f4.bcbits.com/img/0040770732_101.jpg\",\"https_url\":\"https://f4.bcbits.com/img/0040770732_101.jpg\",\"format\":101,\"width\":488,\"height\":90},\"using_map\":null,\"area_tags\":null},\"header_phone\":null,\"design\":{\"bg_color\":\"FFBB00\",\"text_color\":\"363636\",\"secondary_text_color\":\"888888\",\"link_color\":\"0687F5\",\"body_color\":\"FFBB00\",\"hd_ft_color\":\"CCB166\",\"navbar_bg_color\":\"C4A140\",\"invert_iconography\":null,\"tile_bg\":null,\"bg_halign\":\"l\",\"bg_image_id\":null,\"bg_file_name\":null,\"defaultbg\":false,\"bg_fixed\":null,\"bg_behavior\":\"r\"},\"currency\":\"USD\",\"fan_email\":null,\"thanks_enabled\":1,\"reviews_enabled\":1,\"is_label\":false,\"has_label\":false,\"paypal_matching_label_id\":null,\"merch_enabled\":true,\"google_analytics_id\":null,\"has_recommendations\":false,\"has_tralbums\":true,\"has_public_tralbums\":true,\"has_public_merch\":false,\"has_any_downloads\":true,\"has_discounts\":false,\"has_download_codes\":false,\"has_policies\":false,\"sites\":[],\"navbar_items\":[{\"url\":\"/music\",\"title\":\"music\",\"nav_type\":\"m\"},{\"url\":\"/merch\",\"title\":\"merch\",\"nav_type\":\"p\"},{\"url\":\"/live\",\"title\":\"live",
    "bio": "Terrible Pop is a band from Portland, OR. Songs with heart under the hood. Somewhere between stupid and sincere. Thank you for your time. Instagram: @terrible.pop Booking/questions/critique: terriblepopmusic@gmail.com ... more",
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://terriblepop.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Not Mine (Covers Album)",
        "type": "album",
        "url": "https://terriblepop.bandcamp.com/album/not-mine-covers-album"
      },
      {
        "title": "Terrible Pop",
        "type": "album",
        "url": "https://terriblepop.bandcamp.com/album/terrible-pop"
      },
      {
        "title": "Terrible Pop II",
        "type": "album",
        "url": "https://terriblepop.bandcamp.com/album/terrible-pop-ii"
      }
    ]
  },
  {
    "name": "Glass Suburban",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://glasssuburban.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0039746000_10.jpg",
    "bio": "Semi-nostalgic indie rock from Portland and its various and sundry suburbs. Sounds like offset guitars and lazy afternoons in the mid-nineties.",
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://glasssuburban.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "EP4",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/ep4"
      },
      {
        "title": "EP3 + Singles",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/ep3-singles"
      },
      {
        "title": "Sea Anemone [Single]",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/sea-anemone-single"
      },
      {
        "title": "Play Up [Single]",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/play-up-single"
      },
      {
        "title": "Not Today [Single]",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/not-today-single"
      },
      {
        "title": "Cadillac [Single]",
        "type": "album",
        "url": "https://glasssuburban.bandcamp.com/album/cadillac-single"
      }
    ]
  },
  {
    "name": "Reign Cycle",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://reigncycle.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a1572774560_10.jpg",
    "bio": "Born in the brains of two young men under a teary sky. Nursed from the front seats of a compact car and the garage of a mansion to Portland's ever-reaching natural beauty and its steadfast inspiration. Set free with integrity and purpose. Given with love. ... more",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://reigncycle.bandcamp.com/"
      },
      {
        "label": "Facebook",
        "url": "http://www.facebook.com/reigncycle"
      }
    ],
    "releases": [
      {
        "title": "Solstice",
        "type": "album",
        "url": "https://reigncycle.bandcamp.com/album/solstice/"
      }
    ]
  },
  {
    "name": "great year",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://greatyear.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0032612564_10.jpg",
    "bio": "Recreational Sadness League Champs since 2022 Alex. Sean. Gray. Keagan.",
    "submittedGenre": "Emo",
    "tags": [
      "Emo"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://greatyear.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Sleep All Day",
        "type": "track",
        "url": "https://greatyear.bandcamp.com/track/sleep-all-day"
      },
      {
        "title": "Safer Tonight",
        "type": "track",
        "url": "https://greatyear.bandcamp.com/track/safer-tonight"
      }
    ]
  },
  {
    "name": "Well Kinda",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://wellkinda.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a3283650272_10.jpg",
    "bio": "track by Well Kinda",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://wellkinda.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Cocaine",
        "type": "track",
        "url": "https://wellkinda.bandcamp.com/track/cocaine/"
      }
    ]
  },
  {
    "name": "Lions of the Interstate",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://lionsoftheinterstate.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0043714849_10.jpg",
    "bio": "The combined talents of Braxeling mainstays Ben Alberts, Arturo Diaz, Kyla Henry, Rich Millward and Jeremy Petersen. The band has released its second full-length, \"Blossom,\" an eclectic array of dreamy-pop greatness.",
    "submittedGenre": "Indie Pop",
    "tags": [
      "Indie Pop"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://lionsoftheinterstate.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Blossom",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/blossom"
      },
      {
        "title": "Strange Moods",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/strange-moods"
      },
      {
        "title": "Strange Empires",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/strange-empires"
      },
      {
        "title": "Lost in Spokane",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/lost-in-spokane"
      },
      {
        "title": "Hug Point + Death/Love",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/hug-point-death-love"
      },
      {
        "title": "Lions of the Interstate",
        "type": "album",
        "url": "https://lionsoftheinterstate.bandcamp.com/album/lions-of-the-interstate"
      }
    ]
  },
  {
    "name": "Trash Panda Go Kart",
    "location": "Seattle, Washington",
    "bandcampUrl": "https://trashpandagokart.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0043974662_10.jpg",
    "bio": "power twee lesbian raccoon rock from Zinnia & Selena on the Island of Misfit Toys the moon is our bass player, raccoons are the only gods you need \"herstory in the making\" \"chaotic cartooniness turned up to 11\" \"heavy yet whimsical\" ... more",
    "submittedGenre": "Punk",
    "tags": [
      "Punk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://trashpandagokart.bandcamp.com/"
      },
      {
        "label": "trashpandagokart.com",
        "url": "https://trashpandagokart.com/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/trashpandagokart/"
      }
    ],
    "releases": [
      {
        "title": "live raccoons inside",
        "type": "album",
        "url": "https://trashpandagokart.bandcamp.com/album/live-raccoons-inside"
      },
      {
        "title": "RACCOON GODS",
        "type": "album",
        "url": "https://trashpandagokart.bandcamp.com/album/raccoon-gods"
      },
      {
        "title": "Diamonds (2023) - single",
        "type": "track",
        "url": "https://trashpandagokart.bandcamp.com/track/diamonds-2023-single"
      },
      {
        "title": "RACCOON GODS (The Single)",
        "type": "track",
        "url": "https://trashpandagokart.bandcamp.com/track/raccoon-gods-the-single"
      },
      {
        "title": "TPGK in the USA - single",
        "type": "track",
        "url": "https://trashpandagokart.bandcamp.com/track/tpgk-in-the-usa-single"
      },
      {
        "title": "Might As Well Sprouted The Third Eye",
        "type": "album",
        "url": "https://trashpandagokart.bandcamp.com/album/might-as-well-sprouted-the-third-eye"
      }
    ]
  },
  {
    "name": "Bike Fight",
    "location": "Eugene, Oregon",
    "bandcampUrl": "https://bikefightband.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a2665990410_10.jpg",
    "bio": "Just some good ol' boys, never meanin' no harm.",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://bikefightband.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Bright Future",
        "type": "album",
        "url": "https://bikefightband.bandcamp.com/album/bright-future/"
      }
    ]
  },
  {
    "name": "The Eye See You's",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://theeyeseeyous.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a2421388631_10.jpg",
    "bio": "Formed in 2024 in Portland, OR by dueling guitarist/vocalists John Rivers and Leila Siegel, as well as Aadit Bagdi (bass) and David O. (drums), the Eye See You's draw from an eclectic and diverse mix of influences to create a sound that is uniquely their own, bridging the gaps between virtuosity, emotional catharsis, danceability, lush guitar textures, and pure rock fury. ... more",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://theeyeseeyous.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Falls From The Tree",
        "type": "album",
        "url": "https://theeyeseeyous.bandcamp.com/album/falls-from-the-tree/"
      }
    ]
  },
  {
    "name": "BLISTER",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://blisterpdx.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0035245497_10.jpg",
    "bio": "pdx death punk cult worship.",
    "submittedGenre": "Punk",
    "tags": [
      "Punk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://blisterpdx.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Early Onset",
        "type": "album",
        "url": "https://blisterpdx.bandcamp.com/album/early-onset-2"
      },
      {
        "title": "s/t",
        "type": "album",
        "url": "https://blisterpdx.bandcamp.com/album/s-t"
      }
    ]
  },
  {
    "name": "New Victorian",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://newvictorian.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a0524182842_10.jpg",
    "bio": "Rooted in the rainy hush of Portland, Oregon, New Victorian crafts ethereal music for the spaces in between. Like a dream you’re not quite ready to leave, they blend earnest, heart-pinned-to-the-sleeve songwriting with explosive sonic exploration, weaving a soundscape that is both intimate and otherworldly. ... more",
    "submittedGenre": "Shoegaze / Dream Pop",
    "tags": [
      "Shoegaze / Dream Pop"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://newvictorian.bandcamp.com/"
      },
      {
        "label": "Facebook",
        "url": "https://www.facebook.com/NewVictorianmuzak/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/new_victorian.music/"
      },
      {
        "label": "newvictorian.net",
        "url": "https://www.newvictorian.net"
      }
    ],
    "releases": [
      {
        "title": "Spring",
        "type": "album",
        "url": "https://newvictorian.bandcamp.com/album/spring/"
      }
    ]
  },
  {
    "name": "Payne Fulcher",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://etfondle.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0044883082_10.jpg",
    "bio": "#noloudmusic",
    "submittedGenre": "Singer-songwriter",
    "tags": [
      "Singer-songwriter"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://etfondle.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Slavic Dinner E.T. Fondle",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/slavic-dinner"
      },
      {
        "title": "The Bacon's Lament E.T. Fondle and the Little Portland Players",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/the-bacons-lament"
      },
      {
        "title": "Rough Wind E.T. Fondle & The Dan K. Moore Highway Band",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/rough-wind-2"
      },
      {
        "title": "The Jackson Press Payne Fulcher and Gabe Pelli",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/the-jackson-press-2"
      },
      {
        "title": "I Will Take You to the Valley Where the Lily Does Not Toil and the Whirlwind Never Reaps",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/i-will-take-you-to-the-valley-where-the-lily-does-not-toil-and-the-whirlwind-never-reaps"
      },
      {
        "title": "Where I Shall Be Healed of My Grievous Wound",
        "type": "album",
        "url": "https://etfondle.bandcamp.com/album/where-i-shall-be-healed-of-my-grievous-wound"
      }
    ]
  },
  {
    "name": "Rose Gerber",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://rosegerbermusic.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0041874492_10.jpg",
    "bio": "Based in Portland, OR, Rose Gerber is an American roots explorer, incorporating country, folk, rock, alt-rock, and alt-country into a seamless signature aesthetic, where cowboy boots meets Doc Martins.",
    "submittedGenre": "Country / Alt-Country",
    "tags": [
      "Country / Alt-Country"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://rosegerbermusic.bandcamp.com/"
      },
      {
        "label": "rosegerbermusic.com",
        "url": "http://www.rosegerbermusic.com"
      }
    ],
    "releases": [
      {
        "title": "Just Yesterday",
        "type": "track",
        "url": "https://rosegerbermusic.bandcamp.com/track/just-yesterday"
      },
      {
        "title": "Rock Star Baby",
        "type": "track",
        "url": "https://rosegerbermusic.bandcamp.com/track/rock-star-baby"
      },
      {
        "title": "Under the Bleachers",
        "type": "track",
        "url": "https://rosegerbermusic.bandcamp.com/track/under-the-bleachers"
      },
      {
        "title": "Untraveled Highway",
        "type": "album",
        "url": "https://rosegerbermusic.bandcamp.com/album/untraveled-highway"
      },
      {
        "title": "Memories Someday - EP",
        "type": "album",
        "url": "https://rosegerbermusic.bandcamp.com/album/memories-someday-ep"
      },
      {
        "title": "Rearview Driving - single",
        "type": "track",
        "url": "https://rosegerbermusic.bandcamp.com/track/rearview-driving-single"
      }
    ]
  },
  {
    "name": "Fountain Park Apts.",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://fountainparkapts.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a1320570202_10.jpg",
    "bio": "booking/collabs/ saying hi: email: fountainparkaptsmusic@gmail.com",
    "submittedGenre": "Indie Rock",
    "tags": [
      "Indie Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://fountainparkapts.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Tonight Brought Stars",
        "type": "album",
        "url": "https://fountainparkapts.bandcamp.com/album/tonight-brought-stars/"
      }
    ]
  },
  {
    "name": "Buddy Wynkoop",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://buddywynkoop.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0044008727_10.jpg",
    "bio": "Buddy Wynkoop is a six piece art punk outfit.",
    "submittedGenre": "Punk",
    "tags": [
      "Punk"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://buddywynkoop.bandcamp.com/"
      },
      {
        "label": "buddywynkoop.com",
        "url": "http://buddywynkoop.com"
      }
    ],
    "releases": [
      {
        "title": "Nouveau Riche",
        "type": "track",
        "url": "https://buddywynkoop.bandcamp.com/track/nouveau-riche"
      },
      {
        "title": "Better Than Botox",
        "type": "album",
        "url": "https://buddywynkoop.bandcamp.com/album/better-than-botox-2"
      },
      {
        "title": "Electric City",
        "type": "track",
        "url": "https://buddywynkoop.bandcamp.com/track/electric-city"
      },
      {
        "title": "G.S.M.T",
        "type": "track",
        "url": "https://buddywynkoop.bandcamp.com/track/g-s-m-t"
      },
      {
        "title": "Cleanest Dirty Shirt",
        "type": "track",
        "url": "https://buddywynkoop.bandcamp.com/track/cleanest-dirty-shirt"
      },
      {
        "title": "Stress Fracture",
        "type": "track",
        "url": "https://buddywynkoop.bandcamp.com/track/stress-fracture"
      }
    ]
  },
  {
    "name": "My Head Is My Only House",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://mhimoh.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a2489355878_10.jpg",
    "bio": "American expressionist rock and roll band",
    "submittedGenre": "Rock",
    "tags": [
      "Rock"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://mhimoh.bandcamp.com/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/my_head_is_my_only_house/"
      }
    ],
    "releases": [
      {
        "title": "It Isn't You",
        "type": "album",
        "url": "https://mhimoh.bandcamp.com/album/it-isnt-you/"
      }
    ]
  },
  {
    "name": "KING ROPES",
    "location": "Bozeman, montana",
    "bandcampUrl": "https://kingropes.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0041997329_10.jpg",
    "bio": "King Ropes’ 6th full length album, Idaho, is soaked in \"The Spirit of The West\". Whatever that means. Riffing on the idea of Idaho as a kind of misunderstood underdog, the band is more interested in evoking a world both remarkably gorgeous and harshly unforgiving. The band is carving out a sound for itself that reflects modern life in The American West — ... more",
    "submittedGenre": "Americana",
    "tags": [
      "Americana"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://kingropes.bandcamp.com/"
      },
      {
        "label": "kingropesband.com",
        "url": "http://kingropesband.com"
      },
      {
        "label": "Facebook",
        "url": "https://www.facebook.com/kingropesband/"
      }
    ],
    "releases": [
      {
        "title": "IDAHO King Ropes",
        "type": "album",
        "url": "https://kingropes.bandcamp.com/album/idaho"
      },
      {
        "title": "Super Natural",
        "type": "album",
        "url": "https://kingropes.bandcamp.com/album/super-natural"
      },
      {
        "title": "Way Out West",
        "type": "album",
        "url": "https://kingropes.bandcamp.com/album/way-out-west"
      },
      {
        "title": "Big Man on the TV",
        "type": "track",
        "url": "https://kingropes.bandcamp.com/track/big-man-on-the-tv-3"
      },
      {
        "title": "Go Back Where They Came From",
        "type": "album",
        "url": "https://kingropes.bandcamp.com/album/go-back-where-they-came-from"
      },
      {
        "title": "Gravity and Friction King Ropes",
        "type": "album",
        "url": "https://kingropes.bandcamp.com/album/gravity-and-friction"
      }
    ]
  },
  {
    "name": "When We Met",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://whenwemet.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0043097012_10.jpg",
    "bio": "When We Met is a duo out of Portland, Oregon. Their collection of music ranges from alt rock, post punk, ethereal grunge to indie folk, dream pop bangers.",
    "submittedGenre": "Alternative",
    "tags": [
      "Alternative"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://whenwemet.bandcamp.com/"
      },
      {
        "label": "whenwemet.band",
        "url": "http://www.whenwemet.band"
      },
      {
        "label": "Twitter",
        "url": "http://www.twitter.com/whenwemetband"
      },
      {
        "label": "Facebook",
        "url": "http://www.facebook.com/whenwemetband"
      },
      {
        "label": "Instagram",
        "url": "https://instagram.com/whenwemetband/"
      }
    ],
    "releases": [
      {
        "title": "Past Lives",
        "type": "album",
        "url": "https://whenwemet.bandcamp.com/album/past-lives"
      },
      {
        "title": "Bizarre Love Triangle",
        "type": "track",
        "url": "https://whenwemet.bandcamp.com/track/bizarre-love-triangle"
      },
      {
        "title": "Seventeen",
        "type": "track",
        "url": "https://whenwemet.bandcamp.com/track/seventeen"
      },
      {
        "title": "Skinwalker Ranch",
        "type": "track",
        "url": "https://whenwemet.bandcamp.com/track/skinwalker-ranch"
      },
      {
        "title": "All I Want Now",
        "type": "track",
        "url": "https://whenwemet.bandcamp.com/track/all-i-want-now"
      },
      {
        "title": "Where Did They Come From?",
        "type": "album",
        "url": "https://whenwemet.bandcamp.com/album/where-did-they-come-from"
      }
    ]
  },
  {
    "name": "Güero Brown",
    "location": "Seattle, Washington",
    "bandcampUrl": "https://guerobrown.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0040724683_10.jpg",
    "bio": "Güero Brown is an independent band based in Seattle, Washington.",
    "tags": [],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://guerobrown.bandcamp.com/"
      },
      {
        "label": "YouTube",
        "url": "https://www.youtube.com/channel/UC9MsS2OMBMALIN94mY4dsVQ"
      },
      {
        "label": "Facebook",
        "url": "https://www.facebook.com/LeGueroBrown/"
      },
      {
        "label": "Instagram",
        "url": "https://www.instagram.com/le_guero_brown/"
      }
    ],
    "releases": [
      {
        "title": "Bläu",
        "type": "album",
        "url": "https://guerobrown.bandcamp.com/album/bl-u"
      },
      {
        "title": "Güero Brown",
        "type": "album",
        "url": "https://guerobrown.bandcamp.com/album/g-ero-brown"
      }
    ]
  },
  {
    "name": "slow pony",
    "location": "Portland, Oregon",
    "bandcampUrl": "https://slowpony1.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/a0735577736_10.jpg",
    "bio": "Hailing from the damp corners of Portland Oregon , Slow Pony rides the line between alt-country grit and hazy indie rock.",
    "submittedGenre": "Country / Alt-Country",
    "tags": [
      "Country / Alt-Country"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://slowpony1.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Jesus in a Snow Globe",
        "type": "track",
        "url": "https://slowpony1.bandcamp.com/track/jesus-in-a-snow-globe/"
      }
    ]
  },
  {
    "name": "Cedar Lange",
    "location": "Seattle, Washington",
    "bandcampUrl": "https://cedarlange.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0019928244_10.jpg",
    "bio": "trying out this music thing...",
    "submittedGenre": "Alternative",
    "tags": [
      "Alternative"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://cedarlange.bandcamp.com/"
      },
      {
        "label": "SoundCloud",
        "url": "https://soundcloud.com/ceda-lange"
      }
    ],
    "releases": [
      {
        "title": "wild combinations II",
        "type": "album",
        "url": "https://cedarlange.bandcamp.com/album/wild-combinations-ii"
      },
      {
        "title": "Magic Junction",
        "type": "album",
        "url": "https://cedarlange.bandcamp.com/album/magic-junction"
      },
      {
        "title": "wild combinations",
        "type": "album",
        "url": "https://cedarlange.bandcamp.com/album/wild-combinations"
      }
    ]
  },
  {
    "name": "Bandski",
    "location": "Seattle, Washington",
    "bandcampUrl": "https://bandski.bandcamp.com/",
    "image": "https://f4.bcbits.com/img/0040794500_10.jpg",
    "bio": "just a bandski playing our lil songskis in the big worldski",
    "submittedGenre": "Alternative",
    "tags": [
      "Alternative"
    ],
    "links": [
      {
        "label": "Bandcamp",
        "url": "https://bandski.bandcamp.com/"
      }
    ],
    "releases": [
      {
        "title": "Closure",
        "type": "album",
        "url": "https://bandski.bandcamp.com/album/closure"
      },
      {
        "title": "Flightless Birds",
        "type": "track",
        "url": "https://bandski.bandcamp.com/track/flightless-birds-2"
      },
      {
        "title": "It's Loud in Here/Long Way Home (DEMO)",
        "type": "album",
        "url": "https://bandski.bandcamp.com/album/its-loud-in-here-long-way-home-demo"
      }
    ]
  }
];
