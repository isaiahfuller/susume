import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./index.css";
import { RankedTagList } from "../../interfaces";

export default function TagDisplay(props: {
  tags: RankedTagList;
  displayTags: RankedTagList;
  setDisplayTags: Dispatch<SetStateAction<RankedTagList>>;
  randomSearch: (tags?: RankedTagList) => Promise<void>;
  averageScore: number;
  search: (
    mainCast: string,
    trait: string,
    setting: string,
    scene: string,
    time: string,
    demographic: string
  ) => void;
}) {
  const [loading, setLoading] = useState(true);
  const { tags, setDisplayTags, randomSearch } = props;

  useEffect(() => {
    const tempTags = structuredClone(tags);
    randomSearch(tempTags);
    setDisplayTags(tempTags);
    setLoading(false);
  }, []);

  if (loading) return <p>Processing List...</p>;
}
