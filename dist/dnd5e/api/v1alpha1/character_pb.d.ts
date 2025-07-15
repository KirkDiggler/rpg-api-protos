import type { GenEnum, GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv2";
import type { ValidationError, ValidationWarning } from "./common_pb";
import type { Ability, Alignment, Background, Class, Language, Race, Skill, Subrace } from "./enums_pb";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file dnd5e/api/v1alpha1/character.proto.
 */
export declare const file_dnd5e_api_v1alpha1_character: GenFile;
/**
 * Ability scores for a character
 *
 * @generated from message dnd5e.api.v1alpha1.AbilityScores
 */
export type AbilityScores = Message<"dnd5e.api.v1alpha1.AbilityScores"> & {
    /**
     * Strength score (3-18 before racial modifiers)
     *
     * @generated from field: int32 strength = 1;
     */
    strength: number;
    /**
     * Dexterity score (3-18 before racial modifiers)
     *
     * @generated from field: int32 dexterity = 2;
     */
    dexterity: number;
    /**
     * Constitution score (3-18 before racial modifiers)
     *
     * @generated from field: int32 constitution = 3;
     */
    constitution: number;
    /**
     * Intelligence score (3-18 before racial modifiers)
     *
     * @generated from field: int32 intelligence = 4;
     */
    intelligence: number;
    /**
     * Wisdom score (3-18 before racial modifiers)
     *
     * @generated from field: int32 wisdom = 5;
     */
    wisdom: number;
    /**
     * Charisma score (3-18 before racial modifiers)
     *
     * @generated from field: int32 charisma = 6;
     */
    charisma: number;
};
/**
 * Describes the message dnd5e.api.v1alpha1.AbilityScores.
 * Use `create(AbilityScoresSchema)` to create a new message.
 */
export declare const AbilityScoresSchema: GenMessage<AbilityScores>;
/**
 * A complete D&D 5e character
 *
 * @generated from message dnd5e.api.v1alpha1.Character
 */
export type Character = Message<"dnd5e.api.v1alpha1.Character"> & {
    /**
     * Unique identifier
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * Character name
     *
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * Character level (starts at 1)
     *
     * @generated from field: int32 level = 3;
     */
    level: number;
    /**
     * Experience points
     *
     * @generated from field: int32 experience_points = 4;
     */
    experiencePoints: number;
    /**
     * Character race
     *
     * @generated from field: dnd5e.api.v1alpha1.Race race = 5;
     */
    race: Race;
    /**
     * Character subrace if applicable
     *
     * @generated from field: dnd5e.api.v1alpha1.Subrace subrace = 6;
     */
    subrace: Subrace;
    /**
     * Character class
     *
     * @generated from field: dnd5e.api.v1alpha1.Class class = 7;
     */
    class: Class;
    /**
     * Character background
     *
     * @generated from field: dnd5e.api.v1alpha1.Background background = 8;
     */
    background: Background;
    /**
     * Character alignment
     *
     * @generated from field: dnd5e.api.v1alpha1.Alignment alignment = 9;
     */
    alignment: Alignment;
    /**
     * Final ability scores (with racial modifiers applied)
     *
     * @generated from field: dnd5e.api.v1alpha1.AbilityScores ability_scores = 10;
     */
    abilityScores?: AbilityScores;
    /**
     * Ability modifiers (calculated from scores)
     *
     * @generated from field: dnd5e.api.v1alpha1.AbilityModifiers ability_modifiers = 11;
     */
    abilityModifiers?: AbilityModifiers;
    /**
     * Calculated combat values
     *
     * @generated from field: dnd5e.api.v1alpha1.CombatStats combat_stats = 12;
     */
    combatStats?: CombatStats;
    /**
     * Proficiencies
     *
     * @generated from field: dnd5e.api.v1alpha1.Proficiencies proficiencies = 13;
     */
    proficiencies?: Proficiencies;
    /**
     * Known languages
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.Language languages = 14;
     */
    languages: Language[];
    /**
     * Current hit points
     *
     * @generated from field: int32 current_hit_points = 15;
     */
    currentHitPoints: number;
    /**
     * Temporary hit points
     *
     * @generated from field: int32 temporary_hit_points = 16;
     */
    temporaryHitPoints: number;
    /**
     * Session association if any
     *
     * @generated from field: string session_id = 17;
     */
    sessionId: string;
    /**
     * Metadata
     *
     * @generated from field: dnd5e.api.v1alpha1.CharacterMetadata metadata = 18;
     */
    metadata?: CharacterMetadata;
};
/**
 * Describes the message dnd5e.api.v1alpha1.Character.
 * Use `create(CharacterSchema)` to create a new message.
 */
export declare const CharacterSchema: GenMessage<Character>;
/**
 * Ability modifiers calculated from scores
 *
 * @generated from message dnd5e.api.v1alpha1.AbilityModifiers
 */
export type AbilityModifiers = Message<"dnd5e.api.v1alpha1.AbilityModifiers"> & {
    /**
     * @generated from field: int32 strength = 1;
     */
    strength: number;
    /**
     * @generated from field: int32 dexterity = 2;
     */
    dexterity: number;
    /**
     * @generated from field: int32 constitution = 3;
     */
    constitution: number;
    /**
     * @generated from field: int32 intelligence = 4;
     */
    intelligence: number;
    /**
     * @generated from field: int32 wisdom = 5;
     */
    wisdom: number;
    /**
     * @generated from field: int32 charisma = 6;
     */
    charisma: number;
};
/**
 * Describes the message dnd5e.api.v1alpha1.AbilityModifiers.
 * Use `create(AbilityModifiersSchema)` to create a new message.
 */
export declare const AbilityModifiersSchema: GenMessage<AbilityModifiers>;
/**
 * Combat-related statistics
 *
 * @generated from message dnd5e.api.v1alpha1.CombatStats
 */
export type CombatStats = Message<"dnd5e.api.v1alpha1.CombatStats"> & {
    /**
     * Maximum hit points
     *
     * @generated from field: int32 hit_point_maximum = 1;
     */
    hitPointMaximum: number;
    /**
     * Armor class
     *
     * @generated from field: int32 armor_class = 2;
     */
    armorClass: number;
    /**
     * Initiative modifier
     *
     * @generated from field: int32 initiative = 3;
     */
    initiative: number;
    /**
     * Base movement speed in feet
     *
     * @generated from field: int32 speed = 4;
     */
    speed: number;
    /**
     * Proficiency bonus
     *
     * @generated from field: int32 proficiency_bonus = 5;
     */
    proficiencyBonus: number;
    /**
     * Hit dice (e.g., 1d10 for fighter)
     *
     * @generated from field: string hit_dice = 6;
     */
    hitDice: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CombatStats.
 * Use `create(CombatStatsSchema)` to create a new message.
 */
export declare const CombatStatsSchema: GenMessage<CombatStats>;
/**
 * Character proficiencies
 *
 * @generated from message dnd5e.api.v1alpha1.Proficiencies
 */
export type Proficiencies = Message<"dnd5e.api.v1alpha1.Proficiencies"> & {
    /**
     * Skill proficiencies
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.Skill skills = 1;
     */
    skills: Skill[];
    /**
     * Saving throw proficiencies
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.Ability saving_throws = 2;
     */
    savingThrows: Ability[];
    /**
     * Armor proficiencies (as strings for now)
     *
     * @generated from field: repeated string armor = 3;
     */
    armor: string[];
    /**
     * Weapon proficiencies (as strings for now)
     *
     * @generated from field: repeated string weapons = 4;
     */
    weapons: string[];
    /**
     * Tool proficiencies (as strings for now)
     *
     * @generated from field: repeated string tools = 5;
     */
    tools: string[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.Proficiencies.
 * Use `create(ProficienciesSchema)` to create a new message.
 */
export declare const ProficienciesSchema: GenMessage<Proficiencies>;
/**
 * Character metadata
 *
 * @generated from message dnd5e.api.v1alpha1.CharacterMetadata
 */
export type CharacterMetadata = Message<"dnd5e.api.v1alpha1.CharacterMetadata"> & {
    /**
     * When the character was created
     *
     * @generated from field: int64 created_at = 1;
     */
    createdAt: bigint;
    /**
     * When the character was last updated
     *
     * @generated from field: int64 updated_at = 2;
     */
    updatedAt: bigint;
    /**
     * Player/user who owns this character
     *
     * @generated from field: string player_id = 3;
     */
    playerId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CharacterMetadata.
 * Use `create(CharacterMetadataSchema)` to create a new message.
 */
export declare const CharacterMetadataSchema: GenMessage<CharacterMetadata>;
/**
 * Request to get a character
 *
 * @generated from message dnd5e.api.v1alpha1.GetCharacterRequest
 */
export type GetCharacterRequest = Message<"dnd5e.api.v1alpha1.GetCharacterRequest"> & {
    /**
     * The character ID to retrieve
     *
     * @generated from field: string character_id = 1;
     */
    characterId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.GetCharacterRequest.
 * Use `create(GetCharacterRequestSchema)` to create a new message.
 */
export declare const GetCharacterRequestSchema: GenMessage<GetCharacterRequest>;
/**
 * Response containing a character
 *
 * @generated from message dnd5e.api.v1alpha1.GetCharacterResponse
 */
export type GetCharacterResponse = Message<"dnd5e.api.v1alpha1.GetCharacterResponse"> & {
    /**
     * The requested character
     *
     * @generated from field: dnd5e.api.v1alpha1.Character character = 1;
     */
    character?: Character;
};
/**
 * Describes the message dnd5e.api.v1alpha1.GetCharacterResponse.
 * Use `create(GetCharacterResponseSchema)` to create a new message.
 */
export declare const GetCharacterResponseSchema: GenMessage<GetCharacterResponse>;
/**
 * Request to list characters
 *
 * @generated from message dnd5e.api.v1alpha1.ListCharactersRequest
 */
export type ListCharactersRequest = Message<"dnd5e.api.v1alpha1.ListCharactersRequest"> & {
    /**
     * Maximum number of characters to return (1-100, default 20)
     *
     * @generated from field: int32 page_size = 1;
     */
    pageSize: number;
    /**
     * Page token from previous response
     *
     * @generated from field: string page_token = 2;
     */
    pageToken: string;
    /**
     * Filter by session ID
     *
     * @generated from field: string session_id = 3;
     */
    sessionId: string;
    /**
     * Filter by player ID
     *
     * @generated from field: string player_id = 4;
     */
    playerId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ListCharactersRequest.
 * Use `create(ListCharactersRequestSchema)` to create a new message.
 */
export declare const ListCharactersRequestSchema: GenMessage<ListCharactersRequest>;
/**
 * Response containing a list of characters
 *
 * @generated from message dnd5e.api.v1alpha1.ListCharactersResponse
 */
export type ListCharactersResponse = Message<"dnd5e.api.v1alpha1.ListCharactersResponse"> & {
    /**
     * The list of characters
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.Character characters = 1;
     */
    characters: Character[];
    /**
     * Token for next page if available
     *
     * @generated from field: string next_page_token = 2;
     */
    nextPageToken: string;
    /**
     * Total number of characters matching filters
     *
     * @generated from field: int32 total_size = 3;
     */
    totalSize: number;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ListCharactersResponse.
 * Use `create(ListCharactersResponseSchema)` to create a new message.
 */
export declare const ListCharactersResponseSchema: GenMessage<ListCharactersResponse>;
/**
 * Request to update a character
 *
 * @generated from message dnd5e.api.v1alpha1.UpdateCharacterRequest
 */
export type UpdateCharacterRequest = Message<"dnd5e.api.v1alpha1.UpdateCharacterRequest"> & {
    /**
     * The character to update (ID required)
     *
     * @generated from field: dnd5e.api.v1alpha1.Character character = 1;
     */
    character?: Character;
    /**
     * Field mask to specify which fields to update
     * For now, we'll allow updating specific fields
     *
     * @generated from field: repeated string update_mask = 2;
     */
    updateMask: string[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateCharacterRequest.
 * Use `create(UpdateCharacterRequestSchema)` to create a new message.
 */
export declare const UpdateCharacterRequestSchema: GenMessage<UpdateCharacterRequest>;
/**
 * Response from character update
 *
 * @generated from message dnd5e.api.v1alpha1.UpdateCharacterResponse
 */
export type UpdateCharacterResponse = Message<"dnd5e.api.v1alpha1.UpdateCharacterResponse"> & {
    /**
     * The updated character
     *
     * @generated from field: dnd5e.api.v1alpha1.Character character = 1;
     */
    character?: Character;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateCharacterResponse.
 * Use `create(UpdateCharacterResponseSchema)` to create a new message.
 */
export declare const UpdateCharacterResponseSchema: GenMessage<UpdateCharacterResponse>;
/**
 * Request to delete a character
 *
 * @generated from message dnd5e.api.v1alpha1.DeleteCharacterRequest
 */
export type DeleteCharacterRequest = Message<"dnd5e.api.v1alpha1.DeleteCharacterRequest"> & {
    /**
     * The character ID to delete
     *
     * @generated from field: string character_id = 1;
     */
    characterId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteCharacterRequest.
 * Use `create(DeleteCharacterRequestSchema)` to create a new message.
 */
export declare const DeleteCharacterRequestSchema: GenMessage<DeleteCharacterRequest>;
/**
 * Response from character deletion
 *
 * @generated from message dnd5e.api.v1alpha1.DeleteCharacterResponse
 */
export type DeleteCharacterResponse = Message<"dnd5e.api.v1alpha1.DeleteCharacterResponse"> & {
    /**
     * Confirmation message
     *
     * @generated from field: string message = 1;
     */
    message: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteCharacterResponse.
 * Use `create(DeleteCharacterResponseSchema)` to create a new message.
 */
export declare const DeleteCharacterResponseSchema: GenMessage<DeleteCharacterResponse>;
/**
 * Character draft with optional fields
 *
 * @generated from message dnd5e.api.v1alpha1.CharacterDraft
 */
export type CharacterDraft = Message<"dnd5e.api.v1alpha1.CharacterDraft"> & {
    /**
     * Unique identifier
     *
     * @generated from field: string id = 1;
     */
    id: string;
    /**
     * Player creating this character
     *
     * @generated from field: string player_id = 2;
     */
    playerId: string;
    /**
     * Session if part of one
     *
     * @generated from field: string session_id = 3;
     */
    sessionId: string;
    /**
     * All fields are optional during draft
     *
     * @generated from field: string name = 4;
     */
    name: string;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Race race = 5;
     */
    race: Race;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Subrace subrace = 6;
     */
    subrace: Subrace;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Class class = 7;
     */
    class: Class;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Background background = 8;
     */
    background: Background;
    /**
     * @generated from field: dnd5e.api.v1alpha1.AbilityScores ability_scores = 9;
     */
    abilityScores?: AbilityScores;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Alignment alignment = 10;
     */
    alignment: Alignment;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.Skill starting_skills = 11;
     */
    startingSkills: Skill[];
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.Language additional_languages = 12;
     */
    additionalLanguages: Language[];
    /**
     * Track what steps are complete
     *
     * @generated from field: dnd5e.api.v1alpha1.CreationProgress progress = 13;
     */
    progress?: CreationProgress;
    /**
     * When this draft expires (e.g., 30 days)
     *
     * @generated from field: int64 expires_at = 14;
     */
    expiresAt: bigint;
    /**
     * Metadata
     *
     * @generated from field: dnd5e.api.v1alpha1.DraftMetadata metadata = 15;
     */
    metadata?: DraftMetadata;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CharacterDraft.
 * Use `create(CharacterDraftSchema)` to create a new message.
 */
export declare const CharacterDraftSchema: GenMessage<CharacterDraft>;
/**
 * Tracks which parts of character creation are complete
 *
 * @generated from message dnd5e.api.v1alpha1.CreationProgress
 */
export type CreationProgress = Message<"dnd5e.api.v1alpha1.CreationProgress"> & {
    /**
     * @generated from field: bool has_name = 1;
     */
    hasName: boolean;
    /**
     * @generated from field: bool has_race = 2;
     */
    hasRace: boolean;
    /**
     * @generated from field: bool has_class = 3;
     */
    hasClass: boolean;
    /**
     * @generated from field: bool has_background = 4;
     */
    hasBackground: boolean;
    /**
     * @generated from field: bool has_ability_scores = 5;
     */
    hasAbilityScores: boolean;
    /**
     * @generated from field: bool has_skills = 6;
     */
    hasSkills: boolean;
    /**
     * @generated from field: bool has_languages = 7;
     */
    hasLanguages: boolean;
    /**
     * Overall completion percentage
     *
     * @generated from field: int32 completion_percentage = 8;
     */
    completionPercentage: number;
    /**
     * What step they're currently on
     *
     * @generated from field: dnd5e.api.v1alpha1.CreationStep current_step = 9;
     */
    currentStep: CreationStep;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CreationProgress.
 * Use `create(CreationProgressSchema)` to create a new message.
 */
export declare const CreationProgressSchema: GenMessage<CreationProgress>;
/**
 * Draft metadata
 *
 * @generated from message dnd5e.api.v1alpha1.DraftMetadata
 */
export type DraftMetadata = Message<"dnd5e.api.v1alpha1.DraftMetadata"> & {
    /**
     * @generated from field: int64 created_at = 1;
     */
    createdAt: bigint;
    /**
     * @generated from field: int64 updated_at = 2;
     */
    updatedAt: bigint;
    /**
     * @generated from field: string discord_channel_id = 3;
     */
    discordChannelId: string;
    /**
     * @generated from field: string discord_message_id = 4;
     */
    discordMessageId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DraftMetadata.
 * Use `create(DraftMetadataSchema)` to create a new message.
 */
export declare const DraftMetadataSchema: GenMessage<DraftMetadata>;
/**
 * Request to create a draft
 *
 * @generated from message dnd5e.api.v1alpha1.CreateDraftRequest
 */
export type CreateDraftRequest = Message<"dnd5e.api.v1alpha1.CreateDraftRequest"> & {
    /**
     * @generated from field: string player_id = 1;
     */
    playerId: string;
    /**
     * Optional
     *
     * @generated from field: string session_id = 2;
     */
    sessionId: string;
    /**
     * Can optionally provide initial data
     *
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft initial_data = 3;
     */
    initialData?: CharacterDraft;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CreateDraftRequest.
 * Use `create(CreateDraftRequestSchema)` to create a new message.
 */
export declare const CreateDraftRequestSchema: GenMessage<CreateDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.CreateDraftResponse
 */
export type CreateDraftResponse = Message<"dnd5e.api.v1alpha1.CreateDraftResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
};
/**
 * Describes the message dnd5e.api.v1alpha1.CreateDraftResponse.
 * Use `create(CreateDraftResponseSchema)` to create a new message.
 */
export declare const CreateDraftResponseSchema: GenMessage<CreateDraftResponse>;
/**
 * Request to get a draft
 *
 * @generated from message dnd5e.api.v1alpha1.GetDraftRequest
 */
export type GetDraftRequest = Message<"dnd5e.api.v1alpha1.GetDraftRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.GetDraftRequest.
 * Use `create(GetDraftRequestSchema)` to create a new message.
 */
export declare const GetDraftRequestSchema: GenMessage<GetDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.GetDraftResponse
 */
export type GetDraftResponse = Message<"dnd5e.api.v1alpha1.GetDraftResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
};
/**
 * Describes the message dnd5e.api.v1alpha1.GetDraftResponse.
 * Use `create(GetDraftResponseSchema)` to create a new message.
 */
export declare const GetDraftResponseSchema: GenMessage<GetDraftResponse>;
/**
 * Request to update a draft
 *
 * @generated from message dnd5e.api.v1alpha1.UpdateDraftRequest
 */
export type UpdateDraftRequest = Message<"dnd5e.api.v1alpha1.UpdateDraftRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * Only provided fields will be updated
     *
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft updates = 2;
     */
    updates?: CharacterDraft;
    /**
     * Which fields to update (field mask pattern)
     *
     * @generated from field: repeated string update_mask = 3;
     */
    updateMask: string[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateDraftRequest.
 * Use `create(UpdateDraftRequestSchema)` to create a new message.
 */
export declare const UpdateDraftRequestSchema: GenMessage<UpdateDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateDraftResponse
 */
export type UpdateDraftResponse = Message<"dnd5e.api.v1alpha1.UpdateDraftResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * Any validation warnings (not errors)
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateDraftResponse.
 * Use `create(UpdateDraftResponseSchema)` to create a new message.
 */
export declare const UpdateDraftResponseSchema: GenMessage<UpdateDraftResponse>;
/**
 * Section-based update requests
 *
 * @generated from message dnd5e.api.v1alpha1.UpdateNameRequest
 */
export type UpdateNameRequest = Message<"dnd5e.api.v1alpha1.UpdateNameRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateNameRequest.
 * Use `create(UpdateNameRequestSchema)` to create a new message.
 */
export declare const UpdateNameRequestSchema: GenMessage<UpdateNameRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateRaceRequest
 */
export type UpdateRaceRequest = Message<"dnd5e.api.v1alpha1.UpdateRaceRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Race race = 2;
     */
    race: Race;
    /**
     * Optional, required for some races
     *
     * @generated from field: dnd5e.api.v1alpha1.Subrace subrace = 3;
     */
    subrace: Subrace;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateRaceRequest.
 * Use `create(UpdateRaceRequestSchema)` to create a new message.
 */
export declare const UpdateRaceRequestSchema: GenMessage<UpdateRaceRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateClassRequest
 */
export type UpdateClassRequest = Message<"dnd5e.api.v1alpha1.UpdateClassRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Class class = 2;
     */
    class: Class;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateClassRequest.
 * Use `create(UpdateClassRequestSchema)` to create a new message.
 */
export declare const UpdateClassRequestSchema: GenMessage<UpdateClassRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateBackgroundRequest
 */
export type UpdateBackgroundRequest = Message<"dnd5e.api.v1alpha1.UpdateBackgroundRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: dnd5e.api.v1alpha1.Background background = 2;
     */
    background: Background;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateBackgroundRequest.
 * Use `create(UpdateBackgroundRequestSchema)` to create a new message.
 */
export declare const UpdateBackgroundRequestSchema: GenMessage<UpdateBackgroundRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateAbilityScoresRequest
 */
export type UpdateAbilityScoresRequest = Message<"dnd5e.api.v1alpha1.UpdateAbilityScoresRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: dnd5e.api.v1alpha1.AbilityScores ability_scores = 2;
     */
    abilityScores?: AbilityScores;
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateAbilityScoresRequest.
 * Use `create(UpdateAbilityScoresRequestSchema)` to create a new message.
 */
export declare const UpdateAbilityScoresRequestSchema: GenMessage<UpdateAbilityScoresRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateSkillsRequest
 */
export type UpdateSkillsRequest = Message<"dnd5e.api.v1alpha1.UpdateSkillsRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.Skill skills = 2;
     */
    skills: Skill[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateSkillsRequest.
 * Use `create(UpdateSkillsRequestSchema)` to create a new message.
 */
export declare const UpdateSkillsRequestSchema: GenMessage<UpdateSkillsRequest>;
/**
 * Section-based update responses
 *
 * @generated from message dnd5e.api.v1alpha1.UpdateNameResponse
 */
export type UpdateNameResponse = Message<"dnd5e.api.v1alpha1.UpdateNameResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateNameResponse.
 * Use `create(UpdateNameResponseSchema)` to create a new message.
 */
export declare const UpdateNameResponseSchema: GenMessage<UpdateNameResponse>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateRaceResponse
 */
export type UpdateRaceResponse = Message<"dnd5e.api.v1alpha1.UpdateRaceResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateRaceResponse.
 * Use `create(UpdateRaceResponseSchema)` to create a new message.
 */
export declare const UpdateRaceResponseSchema: GenMessage<UpdateRaceResponse>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateClassResponse
 */
export type UpdateClassResponse = Message<"dnd5e.api.v1alpha1.UpdateClassResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateClassResponse.
 * Use `create(UpdateClassResponseSchema)` to create a new message.
 */
export declare const UpdateClassResponseSchema: GenMessage<UpdateClassResponse>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateBackgroundResponse
 */
export type UpdateBackgroundResponse = Message<"dnd5e.api.v1alpha1.UpdateBackgroundResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateBackgroundResponse.
 * Use `create(UpdateBackgroundResponseSchema)` to create a new message.
 */
export declare const UpdateBackgroundResponseSchema: GenMessage<UpdateBackgroundResponse>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateAbilityScoresResponse
 */
export type UpdateAbilityScoresResponse = Message<"dnd5e.api.v1alpha1.UpdateAbilityScoresResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateAbilityScoresResponse.
 * Use `create(UpdateAbilityScoresResponseSchema)` to create a new message.
 */
export declare const UpdateAbilityScoresResponseSchema: GenMessage<UpdateAbilityScoresResponse>;
/**
 * @generated from message dnd5e.api.v1alpha1.UpdateSkillsResponse
 */
export type UpdateSkillsResponse = Message<"dnd5e.api.v1alpha1.UpdateSkillsResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.CharacterDraft draft = 1;
     */
    draft?: CharacterDraft;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 2;
     */
    warnings: ValidationWarning[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateSkillsResponse.
 * Use `create(UpdateSkillsResponseSchema)` to create a new message.
 */
export declare const UpdateSkillsResponseSchema: GenMessage<UpdateSkillsResponse>;
/**
 * Request to list drafts
 *
 * @generated from message dnd5e.api.v1alpha1.ListDraftsRequest
 */
export type ListDraftsRequest = Message<"dnd5e.api.v1alpha1.ListDraftsRequest"> & {
    /**
     * @generated from field: string player_id = 1;
     */
    playerId: string;
    /**
     * Optional filter
     *
     * @generated from field: string session_id = 2;
     */
    sessionId: string;
    /**
     * @generated from field: int32 page_size = 3;
     */
    pageSize: number;
    /**
     * @generated from field: string page_token = 4;
     */
    pageToken: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ListDraftsRequest.
 * Use `create(ListDraftsRequestSchema)` to create a new message.
 */
export declare const ListDraftsRequestSchema: GenMessage<ListDraftsRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.ListDraftsResponse
 */
export type ListDraftsResponse = Message<"dnd5e.api.v1alpha1.ListDraftsResponse"> & {
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.CharacterDraft drafts = 1;
     */
    drafts: CharacterDraft[];
    /**
     * @generated from field: string next_page_token = 2;
     */
    nextPageToken: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ListDraftsResponse.
 * Use `create(ListDraftsResponseSchema)` to create a new message.
 */
export declare const ListDraftsResponseSchema: GenMessage<ListDraftsResponse>;
/**
 * Request to validate draft
 *
 * @generated from message dnd5e.api.v1alpha1.ValidateDraftRequest
 */
export type ValidateDraftRequest = Message<"dnd5e.api.v1alpha1.ValidateDraftRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ValidateDraftRequest.
 * Use `create(ValidateDraftRequestSchema)` to create a new message.
 */
export declare const ValidateDraftRequestSchema: GenMessage<ValidateDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.ValidateDraftResponse
 */
export type ValidateDraftResponse = Message<"dnd5e.api.v1alpha1.ValidateDraftResponse"> & {
    /**
     * @generated from field: bool is_complete = 1;
     */
    isComplete: boolean;
    /**
     * @generated from field: bool is_valid = 2;
     */
    isValid: boolean;
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationError errors = 3;
     */
    errors: ValidationError[];
    /**
     * @generated from field: repeated dnd5e.api.v1alpha1.ValidationWarning warnings = 4;
     */
    warnings: ValidationWarning[];
    /**
     * What's still needed
     *
     * @generated from field: repeated dnd5e.api.v1alpha1.CreationStep missing_steps = 5;
     */
    missingSteps: CreationStep[];
};
/**
 * Describes the message dnd5e.api.v1alpha1.ValidateDraftResponse.
 * Use `create(ValidateDraftResponseSchema)` to create a new message.
 */
export declare const ValidateDraftResponseSchema: GenMessage<ValidateDraftResponse>;
/**
 * Request to finalize draft
 *
 * @generated from message dnd5e.api.v1alpha1.FinalizeDraftRequest
 */
export type FinalizeDraftRequest = Message<"dnd5e.api.v1alpha1.FinalizeDraftRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.FinalizeDraftRequest.
 * Use `create(FinalizeDraftRequestSchema)` to create a new message.
 */
export declare const FinalizeDraftRequestSchema: GenMessage<FinalizeDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.FinalizeDraftResponse
 */
export type FinalizeDraftResponse = Message<"dnd5e.api.v1alpha1.FinalizeDraftResponse"> & {
    /**
     * @generated from field: dnd5e.api.v1alpha1.Character character = 1;
     */
    character?: Character;
    /**
     * Draft is automatically deleted after finalization
     *
     * @generated from field: bool draft_deleted = 2;
     */
    draftDeleted: boolean;
};
/**
 * Describes the message dnd5e.api.v1alpha1.FinalizeDraftResponse.
 * Use `create(FinalizeDraftResponseSchema)` to create a new message.
 */
export declare const FinalizeDraftResponseSchema: GenMessage<FinalizeDraftResponse>;
/**
 * Request to delete draft
 *
 * @generated from message dnd5e.api.v1alpha1.DeleteDraftRequest
 */
export type DeleteDraftRequest = Message<"dnd5e.api.v1alpha1.DeleteDraftRequest"> & {
    /**
     * @generated from field: string draft_id = 1;
     */
    draftId: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteDraftRequest.
 * Use `create(DeleteDraftRequestSchema)` to create a new message.
 */
export declare const DeleteDraftRequestSchema: GenMessage<DeleteDraftRequest>;
/**
 * @generated from message dnd5e.api.v1alpha1.DeleteDraftResponse
 */
export type DeleteDraftResponse = Message<"dnd5e.api.v1alpha1.DeleteDraftResponse"> & {
    /**
     * @generated from field: string message = 1;
     */
    message: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteDraftResponse.
 * Use `create(DeleteDraftResponseSchema)` to create a new message.
 */
export declare const DeleteDraftResponseSchema: GenMessage<DeleteDraftResponse>;
/**
 * Steps in character creation
 *
 * @generated from enum dnd5e.api.v1alpha1.CreationStep
 */
export declare enum CreationStep {
    /**
     * @generated from enum value: CREATION_STEP_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: CREATION_STEP_NAME = 1;
     */
    NAME = 1,
    /**
     * @generated from enum value: CREATION_STEP_RACE = 2;
     */
    RACE = 2,
    /**
     * @generated from enum value: CREATION_STEP_CLASS = 3;
     */
    CLASS = 3,
    /**
     * @generated from enum value: CREATION_STEP_BACKGROUND = 4;
     */
    BACKGROUND = 4,
    /**
     * @generated from enum value: CREATION_STEP_ABILITY_SCORES = 5;
     */
    ABILITY_SCORES = 5,
    /**
     * @generated from enum value: CREATION_STEP_SKILLS = 6;
     */
    SKILLS = 6,
    /**
     * @generated from enum value: CREATION_STEP_LANGUAGES = 7;
     */
    LANGUAGES = 7,
    /**
     * @generated from enum value: CREATION_STEP_REVIEW = 8;
     */
    REVIEW = 8
}
/**
 * Describes the enum dnd5e.api.v1alpha1.CreationStep.
 */
export declare const CreationStepSchema: GenEnum<CreationStep>;
/**
 * @generated from enum dnd5e.api.v1alpha1.WarningType
 */
export declare enum WarningType {
    /**
     * @generated from enum value: WARNING_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: WARNING_TYPE_MISSING_REQUIRED = 1;
     */
    MISSING_REQUIRED = 1,
    /**
     * @generated from enum value: WARNING_TYPE_INVALID_COMBINATION = 2;
     */
    INVALID_COMBINATION = 2,
    /**
     * @generated from enum value: WARNING_TYPE_SUBOPTIMAL_CHOICE = 3;
     */
    SUBOPTIMAL_CHOICE = 3
}
/**
 * Describes the enum dnd5e.api.v1alpha1.WarningType.
 */
export declare const WarningTypeSchema: GenEnum<WarningType>;
/**
 * Service for D&D 5e character creation and management
 * Supports both wizard-style step-by-step creation and free-form editing
 *
 * @generated from service dnd5e.api.v1alpha1.CharacterService
 */
export declare const CharacterService: GenService<{
    /**
     * Draft lifecycle
     *
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.CreateDraft
     */
    createDraft: {
        methodKind: "unary";
        input: typeof CreateDraftRequestSchema;
        output: typeof CreateDraftResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.GetDraft
     */
    getDraft: {
        methodKind: "unary";
        input: typeof GetDraftRequestSchema;
        output: typeof GetDraftResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.ListDrafts
     */
    listDrafts: {
        methodKind: "unary";
        input: typeof ListDraftsRequestSchema;
        output: typeof ListDraftsResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.DeleteDraft
     */
    deleteDraft: {
        methodKind: "unary";
        input: typeof DeleteDraftRequestSchema;
        output: typeof DeleteDraftResponseSchema;
    };
    /**
     * Section-based updates (supports skip-around editing)
     *
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateName
     */
    updateName: {
        methodKind: "unary";
        input: typeof UpdateNameRequestSchema;
        output: typeof UpdateNameResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateRace
     */
    updateRace: {
        methodKind: "unary";
        input: typeof UpdateRaceRequestSchema;
        output: typeof UpdateRaceResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateClass
     */
    updateClass: {
        methodKind: "unary";
        input: typeof UpdateClassRequestSchema;
        output: typeof UpdateClassResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateBackground
     */
    updateBackground: {
        methodKind: "unary";
        input: typeof UpdateBackgroundRequestSchema;
        output: typeof UpdateBackgroundResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateAbilityScores
     */
    updateAbilityScores: {
        methodKind: "unary";
        input: typeof UpdateAbilityScoresRequestSchema;
        output: typeof UpdateAbilityScoresResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.UpdateSkills
     */
    updateSkills: {
        methodKind: "unary";
        input: typeof UpdateSkillsRequestSchema;
        output: typeof UpdateSkillsResponseSchema;
    };
    /**
     * Validation
     *
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.ValidateDraft
     */
    validateDraft: {
        methodKind: "unary";
        input: typeof ValidateDraftRequestSchema;
        output: typeof ValidateDraftResponseSchema;
    };
    /**
     * Character finalization
     *
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.FinalizeDraft
     */
    finalizeDraft: {
        methodKind: "unary";
        input: typeof FinalizeDraftRequestSchema;
        output: typeof FinalizeDraftResponseSchema;
    };
    /**
     * Completed character operations
     *
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.GetCharacter
     */
    getCharacter: {
        methodKind: "unary";
        input: typeof GetCharacterRequestSchema;
        output: typeof GetCharacterResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.ListCharacters
     */
    listCharacters: {
        methodKind: "unary";
        input: typeof ListCharactersRequestSchema;
        output: typeof ListCharactersResponseSchema;
    };
    /**
     * @generated from rpc dnd5e.api.v1alpha1.CharacterService.DeleteCharacter
     */
    deleteCharacter: {
        methodKind: "unary";
        input: typeof DeleteCharacterRequestSchema;
        output: typeof DeleteCharacterResponseSchema;
    };
}>;
