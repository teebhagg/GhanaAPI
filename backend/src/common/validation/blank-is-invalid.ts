/**
 * For a query value that is converted to a number: an empty or blank value
 * (`?lat=`) would become 0 in the conversion and pass as a real value. Turn it
 * into NaN so validation rejects it. Use after `@Type(() => Number)`.
 */
export const blankIsInvalid = ({
  obj,
  key,
  value,
}: {
  obj: Record<string, unknown>;
  key: string;
  value: unknown;
}): unknown => {
  const raw = obj[key];
  return typeof raw === 'string' && raw.trim() === '' ? NaN : value;
};
