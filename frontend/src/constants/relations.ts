export type Sex = "male" | "female" | "";

export const RELATION_TYPES = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "sister", label: "Sister" },
  { value: "brother", label: "Brother" },
  { value: "daughter", label: "Daughter" },
  { value: "son", label: "Son" },
  { value: "wife", label: "Wife" },
  { value: "husband", label: "Husband" },
  { value: "fiancee", label: "Fiancée" },
  { value: "fiance", label: "Fiancé" },
  { value: "grandmother", label: "Grandmother" },
  { value: "grandfather", label: "Grandfather" },
  { value: "granddaughter", label: "Granddaughter" },
  { value: "grandson", label: "Grandson" },
  { value: "aunt", label: "Aunt" },
  { value: "uncle", label: "Uncle" },
  { value: "nephew", label: "Nephew" },
  { value: "niece", label: "Niece" },
  { value: "cousin", label: "Cousin" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

// Relation types that imply the sex of the related person (mirrors the backend).
export const IMPLIED_SEX: Record<string, Sex> = {
  mother: "female", sister: "female", daughter: "female", wife: "female",
  fiancee: "female", grandmother: "female", granddaughter: "female",
  aunt: "female", niece: "female",
  father: "male", brother: "male", son: "male", husband: "male",
  fiance: "male", grandfather: "male", grandson: "male", uncle: "male",
  nephew: "male",
};
