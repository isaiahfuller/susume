import {
  Accordion,
  Button,
  Divider,
  Flex,
  Group,
  Space,
  Stack,
  Text,
  Image,
} from "@mantine/core";
import classes from "./index.module.css";
import { AnimeEntry } from "../../interfaces";
import {
  faFireFlameCurved,
  faMedal,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { useViewportSize } from "@mantine/hooks";

export default function AnimeAccordion(props: { list: AnimeEntry[] }) {
  const { list } = props;
  const [descriptionLines, setDescriptionLines] = useState(5);
  const [activeItem, setActiveItem] = useState("");
  const { width } = useViewportSize();

  const items = list.map((e) => {
    const rated = [];
    const popular = [];
    for (const r of e.rankings) {
      if (r.type === "RATED") {
        rated.push(
          `#${r.rank} ${r.context} ${
            r.season
              ? r.season[0] + r.season.substring(1).toLowerCase() + " "
              : ""
          }${r.year ? r.year : ""}`
        );
      }
      if (r.type === "POPULAR") {
        popular.push(
          `#${r.rank} ${r.context} ${
            r.season
              ? r.season[0] + r.season.substring(1).toLowerCase() + " "
              : ""
          }${r.year ? r.year : ""}`
        );
      }
    }
    const description = DOMPurify.sanitize(e.description);
    return (
      <Accordion.Item key={e.id} value={e.id + ""}>
        <Accordion.Control
          onClick={() => {
            setDescriptionLines(5);
            setActiveItem(e.id + "");
          }}
        >
          <Flex justify="space-between">
            <Group>
              {width > 400 ? (
                <Image src={e.coverImage.large} w={64} px={8} />
              ) : null}
              <Stack maw="76%">
                <Text>{e.title.userPreferred}</Text>
              </Stack>
            </Group>
            <Space />
            <Flex>
              {popular.length ? (
                <Text span p={1}>
                  <FontAwesomeIcon icon={faFireFlameCurved} color="#ed333b" />
                </Text>
              ) : null}
              {rated.length ? (
                <Text span p={1}>
                  <FontAwesomeIcon icon={faMedal} color="#f5c211" />
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Accordion.Control>
        <Accordion.Panel>
          <Text c="dimmed" size="xs">
            {rated.length ? (
              <>
                <FontAwesomeIcon icon={faMedal} color="#f5c211" />{" "}
              </>
            ) : null}
            {rated.reverse().join(", ")}
          </Text>
          <Text c="dimmed" size="xs">
            {popular.length ? (
              <>
                <FontAwesomeIcon icon={faFireFlameCurved} color="#ed333b" />{" "}
              </>
            ) : null}{" "}
            {popular.reverse().join(", ")}
          </Text>
          <Flex>
            <Text
              dangerouslySetInnerHTML={{ __html: description }}
              lineClamp={descriptionLines}
            />
          </Flex>
          <Divider
            label={descriptionLines === 0 ? "Show less" : "Show more"}
            onClick={() =>
              descriptionLines === 0
                ? setDescriptionLines(5)
                : setDescriptionLines(0)
            }
          />
          <Flex
            w="100%"
            justify="center"
            align="center"
            direction={width > 510 ? "row" : "column"}
          >
            {e.trailer ? (
              <>
                <a target="_blank" href={`https://youtu.be/${e.trailer.id}`}>
                  <Button>Watch trailer</Button>{" "}
                </a>
                <Divider
                  orientation={width > 510 ? "horizontal" : "vertical"}
                  p={4}
                />
              </>
            ) : null}
            <Group gap={8}>
              {e.externalLinks.map((e) => {
                return (
                  <a href={e.url} target="_blank" key={e.url}>
                    <Image
                      src={e.icon || faGlobe}
                      w={24}
                      bg={e.color || "black"}
                      p={3}
                      radius="md"
                    />
                  </a>
                );
              })}
            </Group>
          </Flex>
        </Accordion.Panel>
      </Accordion.Item>
    );
  });

  useEffect(() => {
    console.log(list);
    if (list.length > 0) setActiveItem(list[0].id + "");
  }, [list]);

  return (
    <Accordion
      variant="separated"
      defaultValue={list[0].id + ""}
      value={activeItem}
      classNames={{ chevron: classes.chevron, item: classes.item }}
      chevronPosition="left"
      radius="md"
    >
      {items}
    </Accordion>
  );
}
