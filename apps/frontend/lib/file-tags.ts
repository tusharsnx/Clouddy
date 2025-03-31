const dummyFileTags = [
  "Projects",
  "Documents",
  "Desktop",
  "Clouddy",
  "T3Starter",
  "Images",
  "Books",
  "Games",
  "3d",
  "Scene",
  "Landscape",
  "Red",
  "Gradient",
];

export async function fetchFileTags(query: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return dummyFileTags.filter((mention) =>
    mention.toLowerCase().includes(query.toLowerCase()),
  );
}
