export type CatPhoto = {
  id: string;
  src: string;
  alt: string;
};

const mk = (id: string, alt: string): CatPhoto => ({
  id,
  src: `/images/cats/${id}.jpg`,
  alt,
});

export const photoSource = (id: string) => `https://www.pexels.com/photo/${id}/`;

export const BANNER_PHOTO = mk("14572715", "Rudo-biały kot odpoczywający w ciepłym, miękkim świetle");

export const HERO_PHOTOS: CatPhoto[] = [
  mk("30325629", "Kot o intensywnie zielonych oczach w ciepłym, miękkim świetle"),
  mk("17457980", "Rudo-biały kotek patrzący prosto w obiektyw"),
  mk("22398315", "Szary kotek brytyjski leżący na grzbiecie i spoglądający w górę"),
  mk("5263844", "Łaciaty kotek w ruchu na ciepłym beżowym tle"),
];

export const CATEGORY_PHOTOS: Record<string, CatPhoto> = {
  zabawki: mk("34719941", "Ciekawski kotek z żółtą piłką do zabawy"),
  akcesoria: mk("9709428", "Kotek w koralowej obroży na miękkim tle"),
  kubki: mk("9604620", "Szary kot w ciepłym, porannym świetle"),
  "dla-wlasciciela": mk("14572715", "Rudo-biały kot odpoczywający w delikatnym słońcu"),
};

export const GALLERY_PHOTOS: CatPhoto[] = [
  mk("2698519", "Kot brytyjski na mlecznobiałym tle"),
  mk("30002405", "Bengalski kotek na musztardowej tkaninie"),
  mk("11238585", "Kot odpoczywający na kremowym, miękkim kocu"),
  mk("37003918", "Kot syjamski na zielonym aksamitnym fotelu"),
  mk("35710849", "Szaro-biały kot na jasnym, czystym tle"),
  mk("12713649", "Profil kremowego kota w ciepłym świetle"),
];

export const LOOKBOOK_PHOTOS: CatPhoto[] = [
  mk("16173990", "Kotek myjący łapkę w ciepłym, złotym świetle"),
  mk("5509303", "Biały kot na tle delikatnej zieleni"),
  mk("9604620", "Szary kot w złotym, popołudniowym świetle"),
];

export const ABOUT_PHOTOS: CatPhoto[] = [
  mk("32637009", "Puszysty kot w jasnym, skandynawskim wnętrzu"),
  mk("19511759", "Szary kot brytyjski w nastrojowym świetle"),
];
