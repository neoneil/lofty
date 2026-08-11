export const PTE_QUESTION_INFO_SELECT = "info, questions, contributing, examiner, suggestion, screen_instruction, official_requirements, hitting_rate, stability, importance";

export const STUDENT_QUESTION_STAT_SELECT = "id, attempt_count, completed_count, correct_count, wrong_count, total_duration_seconds, last_correct_at, last_wrong_at, best_score, latest_score, is_in_wrong_book";

export const STUDENT_WRONG_QUESTION_SELECT = "id, wrong_count";

export const PTE_RA_WITH_STATUS_SELECT = "id, question_text, question_type, source_platform, source_question_id, difficulty_level, tags, is_prediction, audio_url, audio_duration_seconds, ai_voice, created_at, updated_at, is_real_exam, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_RA_BASE_SELECT = "id, question_body_text, question_type, source_platform, source_question_id, difficulty_level, tags, is_prediction, created_at, updated_at, is_real_exam";

export const PTE_RS_WITH_STATUS_SELECT = "id, question_text, question_type, source_question_id, difficulty_level, is_prediction, audio_url, audio_duration_seconds, ai_voice, usage_count, created_at, updated_at, is_real_exam, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_RS_BASE_SELECT = "id, question_text, question_type, source_question_id, difficulty_level, is_prediction, audio_url, audio_duration_seconds, ai_voice, usage_count, created_at, updated_at, is_real_exam";

export const PTE_DI_WITH_STATUS_SELECT = "id, question_type, source_platform, title, question_text, image_url, answer_info, video_url, ai_keywords, difficulty_level, difficulty_raw, is_prediction, is_real_exam, is_active, tag1, tag2, tag3, tag4, raw_json, created_at, updated_at, search_text, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_DI_BASE_SELECT = "id, question_type, source_platform, title, question_text, image_url, answer_info, video_url, ai_keywords, difficulty_level, difficulty_raw, is_prediction, is_real_exam, is_active, tag1, tag2, tag3, tag4, raw_json, created_at, updated_at, search_text";

export const PTE_RL_WITH_STATUS_SELECT = "id, question_type, source_platform, source_question_id, title, question_title, question_text, audio_url, source_audio_url, storage_path, image_url, question_image_url, original_text, answer_info, ai_keywords, keywords, difficulty_level, is_prediction, is_real_exam, is_active, tag1, tag2, tag3, tag4, created_at, updated_at, search_text, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_RL_BASE_SELECT = "id, question_type, source_platform, source_question_id, title, question_title, question_text, audio_url, source_audio_url, storage_path, image_url, question_image_url, original_text, transcript, answer_info, ai_keywords, keywords, difficulty_level, is_prediction, is_real_exam, is_active, tag1, tag2, tag3, tag4, created_at, updated_at, search_text";

export const PTE_ASQ_WITH_STATUS_SELECT = "id, question_text, answer_text, question_type, is_prediction, created_at, updated_at, search_text, search_vector, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_ASQ_BASE_SELECT = "id, question_text, answer_text, question_type, is_prediction, audio_url, audio_duration_seconds, ai_voice, created_at, updated_at, search_text";

export const PTE_RTS_WITH_STATUS_SELECT = "id, question_type, source_platform, source_question_id, question_num, title, question_title, question_text, question_info, question_info_2, audio_url, source_audio_url, storage_path, audio_variants_json, audio_variant_count, answer_info, ai_keywords, tag_topic, difficulty_level, is_prediction, is_real_exam, is_available, is_active, created_at, updated_at, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_RTS_BASE_SELECT = "id, question_type, source_platform, source_question_id, question_num, title, question_title, question_text, question_info, question_info_2, audio_url, source_audio_url, storage_path, audio_variants_json, audio_variant_count, answer_info, ai_keywords, tag_topic, difficulty_level, is_prediction, is_real_exam, is_available, is_active, created_at, updated_at";

export const PTE_SGD_WITH_STATUS_SELECT = "id, question_type, source_platform, source_question_id, question_num, title, question_title, question_text, audio_url, source_audio_url, storage_path, audio_variants_json, audio_variant_count, answer_info, answer_info_html, original_text, question_info, ai_keywords, keywords, tag_topic, difficulty_level, is_prediction, is_real_exam, is_available, is_active, created_at, updated_at, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_SGD_BASE_SELECT = "id, question_type, source_platform, source_question_id, question_num, title, question_title, question_text, audio_url, source_audio_url, storage_path, audio_variants_json, audio_variant_count, answer_info, answer_info_html, original_text, question_info, ai_keywords, keywords, tag_topic, difficulty_level, is_prediction, is_real_exam, is_available, is_active, created_at, updated_at";

export const PTE_SWT_WITH_STATUS_SELECT = "id, source_question_id, question_title, question_text, answer, question_type, difficulty_level, is_prediction, is_real_exam, created_at, updated_at, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_SWT_BASE_SELECT = "id, source_question_id, question_title, question_text, answer, question_type, difficulty_level, is_prediction, is_real_exam, created_at, updated_at";

export const PTE_WE_WITH_STATUS_SELECT = "id, question_text, question_type, is_prediction, created_at, updated_at, response_type, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_WE_BASE_SELECT = "id, question_text, question_type, is_prediction, created_at, updated_at, response_type";

export const PTE_RO_WITH_STATUS_SELECT = "id, question_title, source_question_id, difficulty_level, is_prediction, sentence_count, question_body_text, created_at, updated_at, is_practiced, attempt_count, correct_count, wrong_count, completed_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_RO_BASE_SELECT = "id, question_title, source_question_id, difficulty_level, is_prediction, sentence_count, question_body_text, created_at, updated_at";

export const PTE_FIBR_WITH_STATUS_SELECT = "id, question_title, question_body_text, question_type, source_platform, difficulty_level, tags, is_prediction, is_real_exam, blanks_json, created_at, updated_at, is_practiced, attempt_count, correct_count, wrong_count, completed_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_FIBR_BASE_SELECT = "id, question_title, question_body_text, question_type, source_platform, difficulty_level, tags, is_prediction, is_real_exam, blanks_json, created_at, updated_at";

export const PTE_FIBRW_WITH_STATUS_SELECT = "id, question_title, question_body_text, question_type, source_platform, difficulty_level, tags, is_prediction, is_real_exam, blanks_json, created_at, updated_at, search_text, search_vector, attempt_count, completed_count, correct_count, wrong_count, total_duration_seconds, last_attempt_at, last_correct_at, last_wrong_at, is_practiced, is_wrong_question, accuracy_percentage";
export const PTE_FIBRW_BASE_SELECT = "id, question_title, question_body_text, question_type, source_platform, difficulty_level, tags, is_prediction, is_real_exam, blanks_json, created_at, updated_at, search_text";

export const PTE_SST_WITH_STATUS_SELECT = "id, question_text, source_question_id, question_type, is_prediction, difficulty_level, is_real_exam, has_original_audio, has_similar_audio, answer_text, transcript_text, created_at, updated_at, audio_url, teacher_video_url, source_audio_url, storage_path, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_SST_BASE_SELECT = "id, question_text, source_question_id, question_type, is_prediction, difficulty_level, is_real_exam, has_original_audio, has_similar_audio, answer_text, transcript_text, created_at, updated_at, audio_url, teacher_video_url, source_audio_url, storage_path";

export const PTE_HIW_QUESTION_SELECT = "id, source_question_id, question_category, question_type, question_text, instruction_text, question_body_text, incorrect_words_json, is_prediction, difficulty_level, is_real_exam, audio_url, audio_duration_seconds, created_at, updated_at";

export const PTE_WFD_WITH_STATUS_SELECT = "id, question_text, question_type, source_platform, source_question_id, difficulty_level, tags, is_prediction, audio_url, audio_duration_seconds, ai_voice, usage_count, created_at, updated_at, is_real_exam, is_practiced, attempt_count, correct_count, wrong_count, last_attempt_at, latest_score, best_score, is_wrong_question";
export const PTE_WFD_BASE_SELECT = "id, question_text, question_type, source_platform, source_question_id, difficulty_level, tags, is_prediction, audio_url, audio_duration_seconds, ai_voice, usage_count, created_at, updated_at, is_real_exam";
