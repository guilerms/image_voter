
export interface ImageFile {
  id: string;
  name: string;
  dataUrl: string;
}

export interface SessionData {
  images: ImageFile[];
  votesPerPerson: number;
}

export interface ResultsData {
  images: ImageFile[];
  userVotes: { [imageId: string]: number };
}
