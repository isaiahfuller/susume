import Entry from "../Entry";
import { AnimeEntry } from "../../interfaces";
import "./index.css";
import { Group, ScrollArea } from "@mantine/core";

interface props {
  recommendations: AnimeEntry[];
}

export default function ListScroll({ recommendations }: props) {
  return (
    <ScrollArea scrollbars="x">
      <Group wrap="nowrap" w="full">
        {recommendations.map((e: AnimeEntry) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Group>
    </ScrollArea>
  );
}
