import { AnimeEntry } from "../../interfaces";
import "./index.css";

export default function Entry(props: { entry: AnimeEntry }) {
  const { entry } = props;

  return (
    <div className="result">
      <a href={entry.siteUrl} target="_blank" draggable="false">
        <img src={entry.coverImage.large} className="result-cover" draggable="false" />
        <span className="result-title">
          <div />
          <p>{entry.title.userPreferred}</p>
          <div />
        </span>
      </a>
    </div>
  );
}
