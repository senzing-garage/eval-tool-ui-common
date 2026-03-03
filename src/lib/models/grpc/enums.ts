export type SzDetailLevel = 'MINIMAL' | 'BRIEF' | 'SUMMARY' | 'VERBOSE';
export const SzDetailLevel = {
    MINIMAL: 'MINIMAL' as SzDetailLevel,
    BRIEF: 'BRIEF' as SzDetailLevel,
    SUMMARY: 'SUMMARY' as SzDetailLevel,
    VERBOSE: 'VERBOSE' as SzDetailLevel,
};

export type SzFeatureMode = 'NONE' | 'REPRESENTATIVE' | 'WITH_DUPLICATES' | 'ATTRIBUTED';
export const SzFeatureMode = {
    NONE: 'NONE' as SzFeatureMode,
    REPRESENTATIVE: 'REPRESENTATIVE' as SzFeatureMode,
    WITHDUPLICATES: 'WITH_DUPLICATES' as SzFeatureMode,
    ATTRIBUTED: 'ATTRIBUTED' as SzFeatureMode,
};

export type SzBoundType = 'INCLUSIVE_LOWER' | 'EXCLUSIVE_LOWER' | 'INCLUSIVE_UPPER' | 'EXCLUSIVE_UPPER';
export const SzBoundType = {
    INCLUSIVELOWER: 'INCLUSIVE_LOWER' as SzBoundType,
    EXCLUSIVELOWER: 'EXCLUSIVE_LOWER' as SzBoundType,
    INCLUSIVEUPPER: 'INCLUSIVE_UPPER' as SzBoundType,
    EXCLUSIVEUPPER: 'EXCLUSIVE_UPPER' as SzBoundType,
};
