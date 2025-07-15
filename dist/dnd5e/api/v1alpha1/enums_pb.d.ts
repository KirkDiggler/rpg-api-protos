import type { GenEnum, GenFile } from "@bufbuild/protobuf/codegenv2";
/**
 * Describes the file dnd5e/api/v1alpha1/enums.proto.
 */
export declare const file_dnd5e_api_v1alpha1_enums: GenFile;
/**
 * D&D 5e character races
 *
 * @generated from enum dnd5e.api.v1alpha1.Race
 */
export declare enum Race {
    /**
     * @generated from enum value: RACE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: RACE_HUMAN = 1;
     */
    HUMAN = 1,
    /**
     * @generated from enum value: RACE_ELF = 2;
     */
    ELF = 2,
    /**
     * @generated from enum value: RACE_DWARF = 3;
     */
    DWARF = 3,
    /**
     * @generated from enum value: RACE_HALFLING = 4;
     */
    HALFLING = 4,
    /**
     * @generated from enum value: RACE_DRAGONBORN = 5;
     */
    DRAGONBORN = 5,
    /**
     * @generated from enum value: RACE_GNOME = 6;
     */
    GNOME = 6,
    /**
     * @generated from enum value: RACE_HALF_ELF = 7;
     */
    HALF_ELF = 7,
    /**
     * @generated from enum value: RACE_HALF_ORC = 8;
     */
    HALF_ORC = 8,
    /**
     * @generated from enum value: RACE_TIEFLING = 9;
     */
    TIEFLING = 9
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Race.
 */
export declare const RaceSchema: GenEnum<Race>;
/**
 * D&D 5e subraces
 *
 * @generated from enum dnd5e.api.v1alpha1.Subrace
 */
export declare enum Subrace {
    /**
     * @generated from enum value: SUBRACE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Elf subraces
     *
     * @generated from enum value: SUBRACE_HIGH_ELF = 1;
     */
    HIGH_ELF = 1,
    /**
     * @generated from enum value: SUBRACE_WOOD_ELF = 2;
     */
    WOOD_ELF = 2,
    /**
     * @generated from enum value: SUBRACE_DARK_ELF = 3;
     */
    DARK_ELF = 3,
    /**
     * Dwarf subraces
     *
     * @generated from enum value: SUBRACE_HILL_DWARF = 4;
     */
    HILL_DWARF = 4,
    /**
     * @generated from enum value: SUBRACE_MOUNTAIN_DWARF = 5;
     */
    MOUNTAIN_DWARF = 5,
    /**
     * Halfling subraces
     *
     * @generated from enum value: SUBRACE_LIGHTFOOT_HALFLING = 6;
     */
    LIGHTFOOT_HALFLING = 6,
    /**
     * @generated from enum value: SUBRACE_STOUT_HALFLING = 7;
     */
    STOUT_HALFLING = 7,
    /**
     * Gnome subraces
     *
     * @generated from enum value: SUBRACE_FOREST_GNOME = 8;
     */
    FOREST_GNOME = 8,
    /**
     * Dragonborn ancestry handled separately
     * Tiefling variants could be added
     *
     * @generated from enum value: SUBRACE_ROCK_GNOME = 9;
     */
    ROCK_GNOME = 9
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Subrace.
 */
export declare const SubraceSchema: GenEnum<Subrace>;
/**
 * D&D 5e character classes
 *
 * @generated from enum dnd5e.api.v1alpha1.Class
 */
export declare enum Class {
    /**
     * @generated from enum value: CLASS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: CLASS_BARBARIAN = 1;
     */
    BARBARIAN = 1,
    /**
     * @generated from enum value: CLASS_BARD = 2;
     */
    BARD = 2,
    /**
     * @generated from enum value: CLASS_CLERIC = 3;
     */
    CLERIC = 3,
    /**
     * @generated from enum value: CLASS_DRUID = 4;
     */
    DRUID = 4,
    /**
     * @generated from enum value: CLASS_FIGHTER = 5;
     */
    FIGHTER = 5,
    /**
     * @generated from enum value: CLASS_MONK = 6;
     */
    MONK = 6,
    /**
     * @generated from enum value: CLASS_PALADIN = 7;
     */
    PALADIN = 7,
    /**
     * @generated from enum value: CLASS_RANGER = 8;
     */
    RANGER = 8,
    /**
     * @generated from enum value: CLASS_ROGUE = 9;
     */
    ROGUE = 9,
    /**
     * @generated from enum value: CLASS_SORCERER = 10;
     */
    SORCERER = 10,
    /**
     * @generated from enum value: CLASS_WARLOCK = 11;
     */
    WARLOCK = 11,
    /**
     * @generated from enum value: CLASS_WIZARD = 12;
     */
    WIZARD = 12
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Class.
 */
export declare const ClassSchema: GenEnum<Class>;
/**
 * D&D 5e abilities
 *
 * @generated from enum dnd5e.api.v1alpha1.Ability
 */
export declare enum Ability {
    /**
     * @generated from enum value: ABILITY_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: ABILITY_STRENGTH = 1;
     */
    STRENGTH = 1,
    /**
     * @generated from enum value: ABILITY_DEXTERITY = 2;
     */
    DEXTERITY = 2,
    /**
     * @generated from enum value: ABILITY_CONSTITUTION = 3;
     */
    CONSTITUTION = 3,
    /**
     * @generated from enum value: ABILITY_INTELLIGENCE = 4;
     */
    INTELLIGENCE = 4,
    /**
     * @generated from enum value: ABILITY_WISDOM = 5;
     */
    WISDOM = 5,
    /**
     * @generated from enum value: ABILITY_CHARISMA = 6;
     */
    CHARISMA = 6
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Ability.
 */
export declare const AbilitySchema: GenEnum<Ability>;
/**
 * D&D 5e skills
 *
 * @generated from enum dnd5e.api.v1alpha1.Skill
 */
export declare enum Skill {
    /**
     * @generated from enum value: SKILL_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: SKILL_ACROBATICS = 1;
     */
    ACROBATICS = 1,
    /**
     * @generated from enum value: SKILL_ANIMAL_HANDLING = 2;
     */
    ANIMAL_HANDLING = 2,
    /**
     * @generated from enum value: SKILL_ARCANA = 3;
     */
    ARCANA = 3,
    /**
     * @generated from enum value: SKILL_ATHLETICS = 4;
     */
    ATHLETICS = 4,
    /**
     * @generated from enum value: SKILL_DECEPTION = 5;
     */
    DECEPTION = 5,
    /**
     * @generated from enum value: SKILL_HISTORY = 6;
     */
    HISTORY = 6,
    /**
     * @generated from enum value: SKILL_INSIGHT = 7;
     */
    INSIGHT = 7,
    /**
     * @generated from enum value: SKILL_INTIMIDATION = 8;
     */
    INTIMIDATION = 8,
    /**
     * @generated from enum value: SKILL_INVESTIGATION = 9;
     */
    INVESTIGATION = 9,
    /**
     * @generated from enum value: SKILL_MEDICINE = 10;
     */
    MEDICINE = 10,
    /**
     * @generated from enum value: SKILL_NATURE = 11;
     */
    NATURE = 11,
    /**
     * @generated from enum value: SKILL_PERCEPTION = 12;
     */
    PERCEPTION = 12,
    /**
     * @generated from enum value: SKILL_PERFORMANCE = 13;
     */
    PERFORMANCE = 13,
    /**
     * @generated from enum value: SKILL_PERSUASION = 14;
     */
    PERSUASION = 14,
    /**
     * @generated from enum value: SKILL_RELIGION = 15;
     */
    RELIGION = 15,
    /**
     * @generated from enum value: SKILL_SLEIGHT_OF_HAND = 16;
     */
    SLEIGHT_OF_HAND = 16,
    /**
     * @generated from enum value: SKILL_STEALTH = 17;
     */
    STEALTH = 17,
    /**
     * @generated from enum value: SKILL_SURVIVAL = 18;
     */
    SURVIVAL = 18
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Skill.
 */
export declare const SkillSchema: GenEnum<Skill>;
/**
 * D&D 5e alignments
 *
 * @generated from enum dnd5e.api.v1alpha1.Alignment
 */
export declare enum Alignment {
    /**
     * @generated from enum value: ALIGNMENT_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: ALIGNMENT_LAWFUL_GOOD = 1;
     */
    LAWFUL_GOOD = 1,
    /**
     * @generated from enum value: ALIGNMENT_NEUTRAL_GOOD = 2;
     */
    NEUTRAL_GOOD = 2,
    /**
     * @generated from enum value: ALIGNMENT_CHAOTIC_GOOD = 3;
     */
    CHAOTIC_GOOD = 3,
    /**
     * @generated from enum value: ALIGNMENT_LAWFUL_NEUTRAL = 4;
     */
    LAWFUL_NEUTRAL = 4,
    /**
     * @generated from enum value: ALIGNMENT_TRUE_NEUTRAL = 5;
     */
    TRUE_NEUTRAL = 5,
    /**
     * @generated from enum value: ALIGNMENT_CHAOTIC_NEUTRAL = 6;
     */
    CHAOTIC_NEUTRAL = 6,
    /**
     * @generated from enum value: ALIGNMENT_LAWFUL_EVIL = 7;
     */
    LAWFUL_EVIL = 7,
    /**
     * @generated from enum value: ALIGNMENT_NEUTRAL_EVIL = 8;
     */
    NEUTRAL_EVIL = 8,
    /**
     * @generated from enum value: ALIGNMENT_CHAOTIC_EVIL = 9;
     */
    CHAOTIC_EVIL = 9
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Alignment.
 */
export declare const AlignmentSchema: GenEnum<Alignment>;
/**
 * D&D 5e backgrounds
 *
 * @generated from enum dnd5e.api.v1alpha1.Background
 */
export declare enum Background {
    /**
     * @generated from enum value: BACKGROUND_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: BACKGROUND_ACOLYTE = 1;
     */
    ACOLYTE = 1,
    /**
     * @generated from enum value: BACKGROUND_CHARLATAN = 2;
     */
    CHARLATAN = 2,
    /**
     * @generated from enum value: BACKGROUND_CRIMINAL = 3;
     */
    CRIMINAL = 3,
    /**
     * @generated from enum value: BACKGROUND_ENTERTAINER = 4;
     */
    ENTERTAINER = 4,
    /**
     * @generated from enum value: BACKGROUND_FOLK_HERO = 5;
     */
    FOLK_HERO = 5,
    /**
     * @generated from enum value: BACKGROUND_GUILD_ARTISAN = 6;
     */
    GUILD_ARTISAN = 6,
    /**
     * @generated from enum value: BACKGROUND_HERMIT = 7;
     */
    HERMIT = 7,
    /**
     * @generated from enum value: BACKGROUND_NOBLE = 8;
     */
    NOBLE = 8,
    /**
     * @generated from enum value: BACKGROUND_OUTLANDER = 9;
     */
    OUTLANDER = 9,
    /**
     * @generated from enum value: BACKGROUND_SAGE = 10;
     */
    SAGE = 10,
    /**
     * @generated from enum value: BACKGROUND_SAILOR = 11;
     */
    SAILOR = 11,
    /**
     * @generated from enum value: BACKGROUND_SOLDIER = 12;
     */
    SOLDIER = 12,
    /**
     * @generated from enum value: BACKGROUND_URCHIN = 13;
     */
    URCHIN = 13
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Background.
 */
export declare const BackgroundSchema: GenEnum<Background>;
/**
 * D&D 5e languages
 *
 * @generated from enum dnd5e.api.v1alpha1.Language
 */
export declare enum Language {
    /**
     * @generated from enum value: LANGUAGE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: LANGUAGE_COMMON = 1;
     */
    COMMON = 1,
    /**
     * @generated from enum value: LANGUAGE_DWARVISH = 2;
     */
    DWARVISH = 2,
    /**
     * @generated from enum value: LANGUAGE_ELVISH = 3;
     */
    ELVISH = 3,
    /**
     * @generated from enum value: LANGUAGE_GIANT = 4;
     */
    GIANT = 4,
    /**
     * @generated from enum value: LANGUAGE_GNOMISH = 5;
     */
    GNOMISH = 5,
    /**
     * @generated from enum value: LANGUAGE_GOBLIN = 6;
     */
    GOBLIN = 6,
    /**
     * @generated from enum value: LANGUAGE_HALFLING = 7;
     */
    HALFLING = 7,
    /**
     * @generated from enum value: LANGUAGE_ORC = 8;
     */
    ORC = 8,
    /**
     * @generated from enum value: LANGUAGE_ABYSSAL = 9;
     */
    ABYSSAL = 9,
    /**
     * @generated from enum value: LANGUAGE_CELESTIAL = 10;
     */
    CELESTIAL = 10,
    /**
     * @generated from enum value: LANGUAGE_DRACONIC = 11;
     */
    DRACONIC = 11,
    /**
     * @generated from enum value: LANGUAGE_DEEP_SPEECH = 12;
     */
    DEEP_SPEECH = 12,
    /**
     * @generated from enum value: LANGUAGE_INFERNAL = 13;
     */
    INFERNAL = 13,
    /**
     * @generated from enum value: LANGUAGE_PRIMORDIAL = 14;
     */
    PRIMORDIAL = 14,
    /**
     * @generated from enum value: LANGUAGE_SYLVAN = 15;
     */
    SYLVAN = 15,
    /**
     * @generated from enum value: LANGUAGE_UNDERCOMMON = 16;
     */
    UNDERCOMMON = 16
}
/**
 * Describes the enum dnd5e.api.v1alpha1.Language.
 */
export declare const LanguageSchema: GenEnum<Language>;
