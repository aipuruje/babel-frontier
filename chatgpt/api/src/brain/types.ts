// TypeScript types for Brain Pack v1.0.0 Contract
// Auto-generated from brain_pack_v1.json schema

export type Locale = 'uz' | 'ru' | 'en';
export type DeviceClass = 'android_low' | 'android_mid' | 'ios' | 'desktop';
export type NetworkHint = 'offline' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
export type Platform = 'telegram_webapp' | 'web';
export type PaymentGateway = 'click' | 'payme' | 'uzum' | 'other';

// Contract Metadata
export interface BrainPackContract {
    name: string;
    version: string;
    region: string;
    default_locale: Locale;
    supported_locales: Locale[];
    compat: {
        min_worker_version: string;
        min_miniapp_version: string;
    };
    generated_at_iso: string;
    description: string;
}

// Buyer Persona
export interface BuyerPersona {
    market_facts_assumptions: {
        telegram_is_primary_distribution: boolean;
        internet_access_age_10_plus_high: boolean;
        payments_local_first: string[];
        ielts_outcome_pressure_is_high_among_youth: boolean;
    };
    primary_payer_segments: PayerSegment[];
    primary_user_segments: UserSegment[];
    positioning_rules: {
        never_say_ielts: boolean;
        never_use_exam_terms_on_ui: boolean;
        narrative_wrapper: string;
        outcome_wrapper: string;
        trust_wrapper_for_parents: string;
    };
}

export interface PayerSegment {
    segment_id: string;
    label: string;
    age_range: [number, number];
    languages: Locale[];
    devices: {
        primary: string;
        secondary: string;
    };
    motivations: string[];
    anxieties: string[];
    buying_triggers: string[];
    value_promises_required: string[];
}

export interface UserSegment {
    segment_id: string;
    label: string;
    jobs_to_be_done: string[];
    content_preferences: string[];
    engagement_drivers: string[];
    drop_off_risks: string[];
    constraints: {
        time_windows: string[];
        average_session_minutes: [number, number];
        connectivity: string[];
        device_limits: string[];
    };
}

// Privacy & Safety
export interface PrivacyAndSafety {
    minor_safety_mode_default: boolean;
    data_minimization: {
        store_device_fingerprint: string;
        store_location: string;
        store_precise_geolocation: boolean;
    };
    retention_policy_days: {
        raw_events: number;
        attempts: number;
        aggregates: number;
    };
    consent: {
        first_run_notice_required: boolean;
        uz_ru_localized: boolean;
        guardian_controls_supported: boolean;
    };
    anti_abuse: {
        chat_moderation_required: boolean;
        report_and_block: boolean;
        rate_limits: {
            auth_per_minute_per_ip: number;
            submit_per_minute_per_user: number;
        };
    };
}

// Telemetry
export interface TelemetryContract {
    event_envelope: {
        event_id: string;
        user_id: string;
        session_id: string;
        ts_iso: string;
        client: {
            platform: string;
            device_class: string;
            os: string;
            app_version: string;
            locale: string;
            tz: string;
            network_hint: string;
        };
        privacy: {
            is_minor: string;
            consent_version: string;
        };
    };
    events: TelemetryEventDefinition[];
}

export interface TelemetryEventDefinition {
    name: string;
    fields: Record<string, string>;
}

export interface TelemetryEvent {
    event_id: string;
    user_id: string;
    session_id: string;
    ts_iso: string;
    client: {
        platform: Platform;
        device_class: DeviceClass;
        os: string;
        app_version: string;
        locale: Locale;
        tz: string;
        network_hint: NetworkHint;
    };
    privacy: {
        is_minor: boolean;
        consent_version: string;
    };
    event_name: string;
    event_fields: Record<string, unknown>;
}

// Learner Model
export interface LearnerModel {
    state_vector_schema: LearnerStateSchema;
    update_rules: UpdateRules;
}

export interface LearnerStateSchema {
    user_mastery: {
        skills: string[];
        range: [number, number];
        init: number;
    };
    error_fingerprint: {
        top_k: number;
        tags: string[];
        scoring: string;
    };
    engagement: {
        streak_days: number;
        session_regularities: {
            hour_histogram_24: string;
            weekday_histogram_7: string;
        };
        friction_signals: {
            rage_quit_count_7d: number;
            hint_dependency_ratio_7d: number;
            avg_task_time_ms_7d: number;
        };
    };
    fatigue_and_focus: {
        fatigue: number;
        attention_drop_probability: number;
        recommended_session_minutes: number;
    };
    device_constraints: {
        device_class: string;
        low_power_mode: string;
        network_hint: string;
    };
}

export interface UpdateRules {
    mastery_update: {
        method: string;
        params: {
            p_learn: number;
            p_guess: number;
            p_slip: number;
            decay_per_day: number;
        };
    };
    fatigue_update: {
        method: string;
        params: {
            fatigue_gain_per_minute: number;
            fatigue_gain_on_wrong: number;
            fatigue_recovery_per_hour_offline: number;
            late_night_hours: number[];
            late_night_multiplier: number;
        };
    };
    error_fingerprint_update: {
        method: string;
        params: {
            decay_half_life_days: number;
            min_tag_count_to_show: number;
        };
    };
}

// Actual Learner State (stored per user)
export interface LearnerState {
    userId: string;
    mastery: {
        comprehension_reading: number;
        comprehension_listening: number;
        language_grammar: number;
        language_vocab: number;
        production_writing: number;
        production_speaking: number;
    };
    errorFingerprint: ErrorTag[];
    engagement: {
        streakDays: number;
        sessionRegularities: {
            hourHistogram24: number[];
            weekdayHistogram7: number[];
        };
        frictionSignals: {
            rageQuitCount7d: number;
            hintDependencyRatio7d: number;
            avgTaskTimeMs7d: number;
        };
    };
    fatigue: number;
    attentionDropProbability: number;
    recommendedSessionMinutes: number;
    deviceConstraints: {
        deviceClass: DeviceClass;
        lowPowerMode: boolean;
        networkHint: NetworkHint;
    };
    updatedAt: string;
}

export interface ErrorTag {
    tag: string;
    count: number;
    lastSeenAt: string;
}

// Personalization Policy
export interface PersonalizationPolicy {
    policy_goals: string[];
    quest_selection: QuestSelectionPolicy;
    reward_and_penalty: RewardAndPenalty;
    localization_behavior: LocalizationBehavior;
}

export interface QuestSelectionPolicy {
    method: string;
    actions: string[];
    context_features: string[];
    constraints: {
        max_difficulty_jump: number;
        no_more_than_pvp_if_low_mastery: number;
        force_review_if_error_tag_repeats: number;
        low_end_device_disallow_heavy_assets: boolean;
    };
    exploration: {
        epsilon: number;
        epsilon_min: number;
        decay_per_7d: number;
    };
}

export interface RewardAndPenalty {
    xp_curve: {
        rank_thresholds_xp: number[];
        win_xp_multiplier: number;
        loss_xp_multiplier: number;
    };
    streak_rules: {
        daily_bonus_xp: number;
        miss_day_streak_break: boolean;
        streak_freeze_item_allowed: boolean;
    };
    cooldowns_and_bans: {
        goal: string;
        learning_cooldown_trigger: {
            conditions: string[];
            cooldown_minutes: number;
            message_style: string;
        };
        anti_abuse_ban_trigger: {
            conditions: string[];
            ban_minutes: number;
            appeal_supported: boolean;
        };
    };
}

export interface LocalizationBehavior {
    when_to_show_uz_ru: string[];
    default_explanations: string;
    fallback_explanations: string;
    avoid_teacher_tone_for_teens: boolean;
}

// Coach Engine
export interface CoachEngine {
    purpose: string;
    modes: string[];
    constraints: {
        max_tokens_hint: number;
        max_tokens_feedback: number;
        no_exam_words: boolean;
        no_band_scores_in_ui: boolean;
        tone: {
            teen_game_voice: boolean;
            respectful: boolean;
            non_shaming: boolean;
        };
    };
    rubric_playbooks: RubricPlaybook[];
}

export interface RubricPlaybook {
    id: string;
    targets: string[];
    structure: string[];
    localization: Locale[];
}

// Content Engine
export interface ContentEngine {
    pack_sources: {
        canon_quests: string;
        dynamic_quest_templates: string;
        story_assets: string;
    };
    quest_adaptation_rules: {
        adapt_distractors_to_error_fingerprint: boolean;
        shorten_text_for_low_end_device: boolean;
        increase_scaffolding_if_hint_dependency_high: boolean;
        rotate_contexts: string[];
    };
    anti_boredom: {
        no_same_template_twice_in_row: boolean;
        max_same_skill_streak: number;
        inject_surprise_event_probability: number;
    };
}

// Anti-Leak Guardrails
export interface AntiLeakGuardrails {
    forbidden_ui_terms: string[];
    safe_substitutions: Record<string, string>;
    llm_system_rules: string[];
}

// Experimentation
export interface ExperimentationConfig {
    brain_pack_versioning: {
        storage: {
            current_pointer: string;
            packs: string;
        };
        hot_reload: {
            worker_cache_ttl_seconds: number;
            fail_closed_on_missing_pack: boolean;
        };
    };
    ab_testing: {
        unit: string;
        assignment: string;
        experiments: ABExperiment[];
    };
    offline_training_exports: {
        export_name: string;
        format: string;
        fields: string[];
        privacy: {
            pseudonymize_user_ids: boolean;
            remove_raw_text_inputs_by_default: boolean;
        };
    };
}

export interface ABExperiment {
    exp_id: string;
    variants: string[];
    metrics: string[];
}

// Payments
export interface PaymentsContract {
    supported_gateways: PaymentGateway[];
    sku_catalog_pointer: string;
    purchase_rules: {
        no_dark_patterns: boolean;
        parent_friendly_receipts: boolean;
        cooldown_freeze_item: {
            enabled: boolean;
            price_bucket_uzs: number[];
        };
        battle_pass: {
            enabled: boolean;
            season_length_days: number;
        };
    };
}

// Operational Limits
export interface OperationalLimits {
    scale_targets: {
        concurrent_users_peak: number;
        monthly_users: number;
        events_per_user_per_day_estimate: number;
    };
    performance_budgets: {
        p95_api_latency_ms: number;
        quest_payload_max_kb_low_end_device: number;
    };
    fallback_modes: {
        if_llm_unavailable: string;
        if_network_poor: string;
    };
}

// Main Brain Pack Structure
export interface BrainPack {
    contract: BrainPackContract;
    buyer_persona: BuyerPersona;
    privacy_and_safety: PrivacyAndSafety;
    telemetry_contract: TelemetryContract;
    learner_model: LearnerModel;
    personalization_policy: PersonalizationPolicy;
    coach_engine: CoachEngine;
    content_engine: ContentEngine;
    anti_leak_and_story_guardrails: AntiLeakGuardrails;
    experimentation_and_self_evolution: ExperimentationConfig;
    payments_contract: PaymentsContract;
    operational_limits: OperationalLimits;
}
