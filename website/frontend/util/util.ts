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
