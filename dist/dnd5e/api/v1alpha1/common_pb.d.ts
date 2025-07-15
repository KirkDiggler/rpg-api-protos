import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv2";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file dnd5e/api/v1alpha1/common.proto.
 */
export declare const file_dnd5e_api_v1alpha1_common: GenFile;
/**
 * Common error details for D&D 5e validation
 *
 * @generated from message dnd5e.api.v1alpha1.ValidationError
 */
export type ValidationError = Message<"dnd5e.api.v1alpha1.ValidationError"> & {
    /**
     * Field that failed validation
     *
     * @generated from field: string field = 1;
     */
    field: string;
    /**
     * Human-readable error message
     *
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * Error code for programmatic handling
     *
     * @generated from field: string code = 3;
     */
    code: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ValidationError.
 * Use `create(ValidationErrorSchema)` to create a new message.
 */
export declare const ValidationErrorSchema: GenMessage<ValidationError>;
/**
 * Dice notation for various game mechanics
 *
 * @generated from message dnd5e.api.v1alpha1.DiceRoll
 */
export type DiceRoll = Message<"dnd5e.api.v1alpha1.DiceRoll"> & {
    /**
     * Number of dice
     *
     * @generated from field: int32 count = 1;
     */
    count: number;
    /**
     * Die size (4, 6, 8, 10, 12, 20, 100)
     *
     * @generated from field: int32 size = 2;
     */
    size: number;
    /**
     * Modifier to add/subtract
     *
     * @generated from field: int32 modifier = 3;
     */
    modifier: number;
    /**
     * String representation (e.g., "1d20+5")
     *
     * @generated from field: string notation = 4;
     */
    notation: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.DiceRoll.
 * Use `create(DiceRollSchema)` to create a new message.
 */
export declare const DiceRollSchema: GenMessage<DiceRoll>;
/**
 * Modifier with a source for tracking
 *
 * @generated from message dnd5e.api.v1alpha1.Modifier
 */
export type Modifier = Message<"dnd5e.api.v1alpha1.Modifier"> & {
    /**
     * The ability or skill being modified
     *
     * @generated from field: string target = 1;
     */
    target: string;
    /**
     * The modifier value (can be negative)
     *
     * @generated from field: int32 value = 2;
     */
    value: number;
    /**
     * Source of the modifier (e.g., "racial", "class feature")
     *
     * @generated from field: string source = 3;
     */
    source: string;
    /**
     * Type of modifier (e.g., "enhancement", "circumstance")
     *
     * @generated from field: string type = 4;
     */
    type: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.Modifier.
 * Use `create(ModifierSchema)` to create a new message.
 */
export declare const ModifierSchema: GenMessage<Modifier>;
/**
 * Resource tracking (spell slots, hit dice, etc.)
 *
 * @generated from message dnd5e.api.v1alpha1.Resource
 */
export type Resource = Message<"dnd5e.api.v1alpha1.Resource"> & {
    /**
     * Resource name
     *
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * Current value
     *
     * @generated from field: int32 current = 2;
     */
    current: number;
    /**
     * Maximum value
     *
     * @generated from field: int32 maximum = 3;
     */
    maximum: number;
    /**
     * When the resource refreshes ("short rest", "long rest", "daily")
     *
     * @generated from field: string refresh_on = 4;
     */
    refreshOn: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.Resource.
 * Use `create(ResourceSchema)` to create a new message.
 */
export declare const ResourceSchema: GenMessage<Resource>;
/**
 * Status effect or condition
 *
 * @generated from message dnd5e.api.v1alpha1.Condition
 */
export type Condition = Message<"dnd5e.api.v1alpha1.Condition"> & {
    /**
     * Condition name (e.g., "poisoned", "frightened")
     *
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * Source of the condition
     *
     * @generated from field: string source = 2;
     */
    source: string;
    /**
     * Duration in rounds (-1 for indefinite)
     *
     * @generated from field: int32 duration = 3;
     */
    duration: number;
    /**
     * Any additional notes
     *
     * @generated from field: string notes = 4;
     */
    notes: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.Condition.
 * Use `create(ConditionSchema)` to create a new message.
 */
export declare const ConditionSchema: GenMessage<Condition>;
/**
 * Validation warning (non-blocking)
 *
 * @generated from message dnd5e.api.v1alpha1.ValidationWarning
 */
export type ValidationWarning = Message<"dnd5e.api.v1alpha1.ValidationWarning"> & {
    /**
     * Field with warning
     *
     * @generated from field: string field = 1;
     */
    field: string;
    /**
     * Warning message
     *
     * @generated from field: string message = 2;
     */
    message: string;
    /**
     * Warning severity/type
     *
     * @generated from field: string type = 3;
     */
    type: string;
};
/**
 * Describes the message dnd5e.api.v1alpha1.ValidationWarning.
 * Use `create(ValidationWarningSchema)` to create a new message.
 */
export declare const ValidationWarningSchema: GenMessage<ValidationWarning>;
