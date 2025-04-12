export const teamInitials = (name: string) =>
  name
    .split(/[^a-zA-Z]/)
    .map((word) => word.charAt(0))
    .join("");

export const teamColorText = (color: string) => {
  const rgb = [color.slice(1, 3), color.slice(3, 5), color.slice(5)].map(
    (str) => Number.parseInt(str, 16)
  );
  return rgb.every((hex) => hex < 128) ? "text-white" : "text-black";
};

export function weekName(week: number, regular_weeks: number, playoff_size: number) {
  if (week <= regular_weeks) {
    return `Week ${week}`;
  }

  const totalWeeks = regular_weeks + Math.ceil(Math.log2(playoff_size));
  switch (week) {
    case totalWeeks:
      return "Finals";
    case totalWeeks - 1:
      return "Semifinals";
    case totalWeeks - 2:
      return "Quarterfinals";
    default:
      return "go yell at jumpy to fix this";
  }
}