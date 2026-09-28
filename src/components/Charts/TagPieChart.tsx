import { useMemo } from "react";
import { Box, Group, Stack, Text, Title } from "@mantine/core";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RankedTagList } from "../../interfaces";

interface TagPieChartProps {
  category: string;
  tagList: RankedTagList;
}

export default function TagPieChart({ category, tagList }: TagPieChartProps) {
  const groups = useMemo(() => Object.entries(tagList)
    .filter(([name]) => name === category || name.startsWith(`${category}-`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, group], index) => {
      const subcategory = name === category ? "General" : name.slice(category.length + 1);
      const hue = (index * 137.508 + 210) % 360;
      const tags = Object.entries(group.tags)
        .map(([tag, data]) => ({
          name: `${subcategory}: ${tag}`,
          value: new Set(data.entries.map((entry) => entry.mediaId)).size,
        }))
        .filter((tag) => tag.value > 0)
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .map((tag, tagIndex) => ({
          ...tag,
          fill: `hsl(${hue}, 65%, ${45 + (tagIndex % 5) * 7}%)`,
        }));
      return {
        name: subcategory,
        value: tags.reduce((total, tag) => total + tag.value, 0),
        fill: `hsl(${hue}, 65%, 45%)`,
        tags,
      };
    })
    .filter((group) => group.value > 0), [category, tagList]);
  const tags = groups.flatMap((group) => group.tags);

  return (
    <Stack gap="xs" style={{ minWidth: 0 }}>
      <Title order={3}>{category} tags</Title>
      {groups.length === 0 ? <Text c="dimmed">No {category.toLowerCase()} tags available.</Text> : (
        <>
          <Box role="img" aria-label={`${category} tag distribution. Inner ring: subcategories. Outer ring: tags. Slice sizes count anime per tag.`}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={groups} dataKey="value" nameKey="name" innerRadius="25%" outerRadius="52%" isAnimationActive={false}>
                  {groups.map((group) => <Cell key={group.name} fill={group.fill} />)}
                </Pie>
                <Pie data={tags} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="90%" isAnimationActive={false}>
                  {tags.map((tag) => <Cell key={tag.name} fill={tag.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Group gap="sm">
            {groups.map((group) => (
              <Group key={group.name} gap={6}>
                <Box w={10} h={10} bg={group.fill} style={{ borderRadius: 2 }} />
                <Text size="xs">{group.name} ({group.value})</Text>
              </Group>
            ))}
          </Group>
        </>
      )}
    </Stack>
  );
}
