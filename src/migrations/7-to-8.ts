import type { TransformRule } from "../../helper/upgrade-transforms";

export interface MigrationDefinition {
    fromVersion: string;
    toVersion: string;
    classTransforms: TransformRule[];
    importTransforms: { from: string; to: string; description: string; symbolRenames?: { from: string; to: string }[] }[];
    propTransforms: { from: string; to: string; description: string }[];
    structuralPatterns: { pattern: string; instruction: string }[];
    orphanedTokens: string[];
    dependencyChanges: {
        update: Record<string, string>;
        add: Record<string, string>;
        devUpdate: Record<string, string>;
        devAdd: Record<string, string>;
        remove: string[];
    };
    configChanges: {
        tsconfig: { description: string; find: string; replace: string }[];
    };
    notes: string[];
}

export const migration: MigrationDefinition = {
    fromVersion: "7",
    toVersion: "8",

    classTransforms: [
        // Typo fix: skeumorphic → skeuomorphic (handle all orderings)
        {
            pattern: /\bshadow-xs-skeumorphic\b/g,
            replace: "shadow-xs-skeuomorphic",
            description: "shadow-xs-skeumorphic → shadow-xs-skeuomorphic (typo fix)",
        },
        {
            pattern: /\bshadow-skeumorphic\b/g,
            replace: "shadow-skeuomorphic",
            description: "shadow-skeumorphic → shadow-skeuomorphic (typo fix)",
        },

        // Utility color renames
        {
            pattern: /\butility-gray-blue-/g,
            replace: "utility-slate-",
            description: "utility-gray-blue- → utility-slate-",
        },
        {
            pattern: /\butility-blue-light-/g,
            replace: "utility-sky-",
            description: "utility-blue-light- → utility-sky-",
        },
        {
            pattern: /\butility-gray-/g,
            replace: "utility-neutral-",
            description: "utility-gray- → utility-neutral-",
        },
        {
            pattern: /\butility-error-/g,
            replace: "utility-red-",
            description: "utility-error- → utility-red-",
        },
        {
            pattern: /\butility-warning-/g,
            replace: "utility-yellow-",
            description: "utility-warning- → utility-yellow-",
        },
        {
            pattern: /\butility-success-/g,
            replace: "utility-green-",
            description: "utility-success- → utility-green-",
        },

        // Tailwind v4 outline rename
        {
            pattern: /\boutline-none\b/g,
            replace: "outline-hidden",
            description: "outline-none → outline-hidden",
        },

        // Disabled token removals and replacements
        {
            pattern: /\bbg-disabled_subtle\b/g,
            replace: "opacity-50",
            description: "bg-disabled_subtle → opacity-50",
            needsReview: true,
        },
        {
            pattern: /\bbg-disabled\b/g,
            replace: "opacity-50",
            description: "bg-disabled → opacity-50",
            needsReview: true,
        },
        {
            pattern: /\btext-disabled\b/g,
            replace: "",
            description: "text-disabled → removed",
            needsReview: true,
        },
        {
            pattern: /\bring-disabled_subtle\b/g,
            replace: "",
            description: "ring-disabled_subtle → removed",
            needsReview: true,
        },
        {
            pattern: /\bring-disabled\b/g,
            replace: "",
            description: "ring-disabled → removed",
            needsReview: true,
        },
        {
            pattern: /\bborder-disabled_subtle\b/g,
            replace: "",
            description: "border-disabled_subtle → removed",
            needsReview: true,
        },
        {
            pattern: /\bborder-disabled\b/g,
            replace: "",
            description: "border-disabled → removed",
            needsReview: true,
        },
        {
            pattern: /\btext-fg-disabled_subtle\b/g,
            replace: "",
            description: "text-fg-disabled_subtle → removed",
            needsReview: true,
        },
        {
            pattern: /\btext-fg-disabled\b/g,
            replace: "",
            description: "text-fg-disabled → removed",
            needsReview: true,
        },
        {
            pattern: /\btext-placeholder_subtle\b/g,
            replace: "",
            description: "text-placeholder_subtle → removed",
            needsReview: true,
        },

        // Button icon token replacements (_hover variants MUST come first)
        {
            pattern: /\btext-button-primary-icon_hover\b/g,
            replace: "text-white/70",
            description: "text-button-primary-icon_hover → text-white/70",
        },
        {
            pattern: /\btext-button-primary-icon\b/g,
            replace: "text-white/60",
            description: "text-button-primary-icon → text-white/60",
        },
        {
            pattern: /\btext-button-destructive-primary-icon_hover\b/g,
            replace: "text-white/70",
            description: "text-button-destructive-primary-icon_hover → text-white/70",
        },
        {
            pattern: /\btext-button-destructive-primary-icon\b/g,
            replace: "text-white/60",
            description: "text-button-destructive-primary-icon → text-white/60",
        },

        // Misc token renames
        {
            pattern: /\bbg-avatar-bg\b/g,
            replace: "bg-tertiary",
            description: "bg-avatar-bg → bg-tertiary",
        },
        {
            pattern: /\bring-bg-brand-solid\b/g,
            replace: "ring-brand-solid",
            description: "ring-bg-brand-solid → ring-brand-solid",
        },
        {
            pattern: /\bbg-active\b/g,
            replace: "bg-primary_hover",
            description: "bg-active → bg-primary_hover",
            needsReview: true,
        },
        {
            pattern: /\bbg-toggle-button-fg_disabled\b/g,
            replace: "",
            description: "bg-toggle-button-fg_disabled → removed",
            needsReview: true,
        },
    ],

    importTransforms: [
        {
            from: "pin-input/pin-input",
            to: "input/pin-input",
            description: "pin-input moved into input directory",
        },
        {
            from: "nav-item-button",
            to: "nav-button",
            description: "nav-item-button renamed to nav-button",
        },
        {
            from: "select/multi-select",
            to: "select/tag-select",
            description: "multi-select renamed to tag-select (new multi-select is a different component)",
            symbolRenames: [{ from: "MultiSelect", to: "TagSelect" }],
        },
    ],

    propTransforms: [
        {
            from: 'color="gray-blue"',
            to: 'color="slate"',
            description: 'color="gray-blue" renamed to color="slate"',
        },
        {
            from: 'color="blue-light"',
            to: 'color="sky"',
            description: 'color="blue-light" renamed to color="sky"',
        },
    ],

    structuralPatterns: [
        // {
        //     pattern: "AriaDialogTrigger",
        //     instruction:
        //         "Remove AriaDialogTrigger wrapper. Move isOpen and onOpenChange props directly to ModalOverlay. Remove the DialogTrigger import if no longer used.",
        // },
    ],

    orphanedTokens: [
        "bg-disabled_subtle",
        "text-disabled",
        "ring-disabled",
        "border-disabled",
        "text-fg-disabled",
        "bg-avatar-bg",
        "text-button-primary-icon",
        "text-button-destructive-primary-icon",
        "bg-toggle-button-fg_disabled",
        "utility-gray-",
        "utility-error-",
        "utility-warning-",
        "utility-success-",
        "utility-gray-blue-",
        "utility-blue-light-",
        "skeumorphic",
    ],

    dependencyChanges: {
        update: {
            next: "16.2.0",
            react: "^19.2.4",
            "react-dom": "^19.2.4",
            "react-aria-components": "^1.16.0",
            "react-aria": "^3.47.0",
            tailwindcss: "^4.2.2",
            motion: "^12.38.0",
            recharts: "^3.8.0",
        },
        add: {},
        devUpdate: {
            storybook: "^10.3.0",
            vite: "^8.0.0",
            "@vitejs/plugin-react": "^6.0.1",
            eslint: "^10.0.3",
            typescript: "^5.9.3",
        },
        devAdd: {
            "@storybook/test-runner": "^0.24.3",
        },
        remove: [],
    },

    configChanges: {
        tsconfig: [
            {
                description: "Update JSX transform to react-jsx",
                find: '"jsx": "preserve"',
                replace: '"jsx": "react-jsx"',
            },
        ],
    },

    notes: [
        "The v7 MultiSelect (tag-chip style) has been renamed to TagSelect. The new MultiSelect is a different component with autocomplete. Update your imports accordingly.",
        "Default size for Select, ComboBox, and Input changed from 'sm' to 'md'. Review component usage.",
        "Avatar size 'xxs' removed. Use 'xs' instead.",
        "Dropdown no longer defaults to selectionMode='single'. Set explicitly if needed.",
    ],
};
