// @generated by protoc-gen-es v2.6.0 with parameter "target=ts"
// @generated from file dnd5e/api/v1alpha1/character.proto (package dnd5e.api.v1alpha1, syntax proto3)
/* eslint-disable */
import { enumDesc, fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv2";
import { file_dnd5e_api_v1alpha1_common } from "./common_pb";
import { file_dnd5e_api_v1alpha1_enums } from "./enums_pb";
/**
 * Describes the file dnd5e/api/v1alpha1/character.proto.
 */
export const file_dnd5e_api_v1alpha1_character = /*@__PURE__*/ fileDesc("CiJkbmQ1ZS9hcGkvdjFhbHBoYTEvY2hhcmFjdGVyLnByb3RvEhJkbmQ1ZS5hcGkudjFhbHBoYTEiggEKDUFiaWxpdHlTY29yZXMSEAoIc3RyZW5ndGgYASABKAUSEQoJZGV4dGVyaXR5GAIgASgFEhQKDGNvbnN0aXR1dGlvbhgDIAEoBRIUCgxpbnRlbGxpZ2VuY2UYBCABKAUSDgoGd2lzZG9tGAUgASgFEhAKCGNoYXJpc21hGAYgASgFItoFCglDaGFyYWN0ZXISCgoCaWQYASABKAkSDAoEbmFtZRgCIAEoCRINCgVsZXZlbBgDIAEoBRIZChFleHBlcmllbmNlX3BvaW50cxgEIAEoBRImCgRyYWNlGAUgASgOMhguZG5kNWUuYXBpLnYxYWxwaGExLlJhY2USLAoHc3VicmFjZRgGIAEoDjIbLmRuZDVlLmFwaS52MWFscGhhMS5TdWJyYWNlEigKBWNsYXNzGAcgASgOMhkuZG5kNWUuYXBpLnYxYWxwaGExLkNsYXNzEjIKCmJhY2tncm91bmQYCCABKA4yHi5kbmQ1ZS5hcGkudjFhbHBoYTEuQmFja2dyb3VuZBIwCglhbGlnbm1lbnQYCSABKA4yHS5kbmQ1ZS5hcGkudjFhbHBoYTEuQWxpZ25tZW50EjkKDmFiaWxpdHlfc2NvcmVzGAogASgLMiEuZG5kNWUuYXBpLnYxYWxwaGExLkFiaWxpdHlTY29yZXMSPwoRYWJpbGl0eV9tb2RpZmllcnMYCyABKAsyJC5kbmQ1ZS5hcGkudjFhbHBoYTEuQWJpbGl0eU1vZGlmaWVycxI1Cgxjb21iYXRfc3RhdHMYDCABKAsyHy5kbmQ1ZS5hcGkudjFhbHBoYTEuQ29tYmF0U3RhdHMSOAoNcHJvZmljaWVuY2llcxgNIAEoCzIhLmRuZDVlLmFwaS52MWFscGhhMS5Qcm9maWNpZW5jaWVzEi8KCWxhbmd1YWdlcxgOIAMoDjIcLmRuZDVlLmFwaS52MWFscGhhMS5MYW5ndWFnZRIaChJjdXJyZW50X2hpdF9wb2ludHMYDyABKAUSHAoUdGVtcG9yYXJ5X2hpdF9wb2ludHMYECABKAUSEgoKc2Vzc2lvbl9pZBgRIAEoCRI3CghtZXRhZGF0YRgSIAEoCzIlLmRuZDVlLmFwaS52MWFscGhhMS5DaGFyYWN0ZXJNZXRhZGF0YSKFAQoQQWJpbGl0eU1vZGlmaWVycxIQCghzdHJlbmd0aBgBIAEoBRIRCglkZXh0ZXJpdHkYAiABKAUSFAoMY29uc3RpdHV0aW9uGAMgASgFEhQKDGludGVsbGlnZW5jZRgEIAEoBRIOCgZ3aXNkb20YBSABKAUSEAoIY2hhcmlzbWEYBiABKAUijQEKC0NvbWJhdFN0YXRzEhkKEWhpdF9wb2ludF9tYXhpbXVtGAEgASgFEhMKC2FybW9yX2NsYXNzGAIgASgFEhIKCmluaXRpYXRpdmUYAyABKAUSDQoFc3BlZWQYBCABKAUSGQoRcHJvZmljaWVuY3lfYm9udXMYBSABKAUSEAoIaGl0X2RpY2UYBiABKAkinQEKDVByb2ZpY2llbmNpZXMSKQoGc2tpbGxzGAEgAygOMhkuZG5kNWUuYXBpLnYxYWxwaGExLlNraWxsEjIKDXNhdmluZ190aHJvd3MYAiADKA4yGy5kbmQ1ZS5hcGkudjFhbHBoYTEuQWJpbGl0eRINCgVhcm1vchgDIAMoCRIPCgd3ZWFwb25zGAQgAygJEg0KBXRvb2xzGAUgAygJIk4KEUNoYXJhY3Rlck1ldGFkYXRhEhIKCmNyZWF0ZWRfYXQYASABKAMSEgoKdXBkYXRlZF9hdBgCIAEoAxIRCglwbGF5ZXJfaWQYAyABKAkiKwoTR2V0Q2hhcmFjdGVyUmVxdWVzdBIUCgxjaGFyYWN0ZXJfaWQYASABKAkiSAoUR2V0Q2hhcmFjdGVyUmVzcG9uc2USMAoJY2hhcmFjdGVyGAEgASgLMh0uZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlciJlChVMaXN0Q2hhcmFjdGVyc1JlcXVlc3QSEQoJcGFnZV9zaXplGAEgASgFEhIKCnBhZ2VfdG9rZW4YAiABKAkSEgoKc2Vzc2lvbl9pZBgDIAEoCRIRCglwbGF5ZXJfaWQYBCABKAkieAoWTGlzdENoYXJhY3RlcnNSZXNwb25zZRIxCgpjaGFyYWN0ZXJzGAEgAygLMh0uZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlchIXCg9uZXh0X3BhZ2VfdG9rZW4YAiABKAkSEgoKdG90YWxfc2l6ZRgDIAEoBSJfChZVcGRhdGVDaGFyYWN0ZXJSZXF1ZXN0EjAKCWNoYXJhY3RlchgBIAEoCzIdLmRuZDVlLmFwaS52MWFscGhhMS5DaGFyYWN0ZXISEwoLdXBkYXRlX21hc2sYAiADKAkiSwoXVXBkYXRlQ2hhcmFjdGVyUmVzcG9uc2USMAoJY2hhcmFjdGVyGAEgASgLMh0uZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlciIuChZEZWxldGVDaGFyYWN0ZXJSZXF1ZXN0EhQKDGNoYXJhY3Rlcl9pZBgBIAEoCSIqChdEZWxldGVDaGFyYWN0ZXJSZXNwb25zZRIPCgdtZXNzYWdlGAEgASgJIuMECg5DaGFyYWN0ZXJEcmFmdBIKCgJpZBgBIAEoCRIRCglwbGF5ZXJfaWQYAiABKAkSEgoKc2Vzc2lvbl9pZBgDIAEoCRIMCgRuYW1lGAQgASgJEiYKBHJhY2UYBSABKA4yGC5kbmQ1ZS5hcGkudjFhbHBoYTEuUmFjZRIsCgdzdWJyYWNlGAYgASgOMhsuZG5kNWUuYXBpLnYxYWxwaGExLlN1YnJhY2USKAoFY2xhc3MYByABKA4yGS5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2xhc3MSMgoKYmFja2dyb3VuZBgIIAEoDjIeLmRuZDVlLmFwaS52MWFscGhhMS5CYWNrZ3JvdW5kEjkKDmFiaWxpdHlfc2NvcmVzGAkgASgLMiEuZG5kNWUuYXBpLnYxYWxwaGExLkFiaWxpdHlTY29yZXMSMAoJYWxpZ25tZW50GAogASgOMh0uZG5kNWUuYXBpLnYxYWxwaGExLkFsaWdubWVudBIyCg9zdGFydGluZ19za2lsbHMYCyADKA4yGS5kbmQ1ZS5hcGkudjFhbHBoYTEuU2tpbGwSOgoUYWRkaXRpb25hbF9sYW5ndWFnZXMYDCADKA4yHC5kbmQ1ZS5hcGkudjFhbHBoYTEuTGFuZ3VhZ2USNgoIcHJvZ3Jlc3MYDSABKAsyJC5kbmQ1ZS5hcGkudjFhbHBoYTEuQ3JlYXRpb25Qcm9ncmVzcxISCgpleHBpcmVzX2F0GA4gASgDEjMKCG1ldGFkYXRhGA8gASgLMiEuZG5kNWUuYXBpLnYxYWxwaGExLkRyYWZ0TWV0YWRhdGEi/wEKEENyZWF0aW9uUHJvZ3Jlc3MSEAoIaGFzX25hbWUYASABKAgSEAoIaGFzX3JhY2UYAiABKAgSEQoJaGFzX2NsYXNzGAMgASgIEhYKDmhhc19iYWNrZ3JvdW5kGAQgASgIEhoKEmhhc19hYmlsaXR5X3Njb3JlcxgFIAEoCBISCgpoYXNfc2tpbGxzGAYgASgIEhUKDWhhc19sYW5ndWFnZXMYByABKAgSHQoVY29tcGxldGlvbl9wZXJjZW50YWdlGAggASgFEjYKDGN1cnJlbnRfc3RlcBgJIAEoDjIgLmRuZDVlLmFwaS52MWFscGhhMS5DcmVhdGlvblN0ZXAibwoNRHJhZnRNZXRhZGF0YRISCgpjcmVhdGVkX2F0GAEgASgDEhIKCnVwZGF0ZWRfYXQYAiABKAMSGgoSZGlzY29yZF9jaGFubmVsX2lkGAMgASgJEhoKEmRpc2NvcmRfbWVzc2FnZV9pZBgEIAEoCSJ1ChJDcmVhdGVEcmFmdFJlcXVlc3QSEQoJcGxheWVyX2lkGAEgASgJEhIKCnNlc3Npb25faWQYAiABKAkSOAoMaW5pdGlhbF9kYXRhGAMgASgLMiIuZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlckRyYWZ0IkgKE0NyZWF0ZURyYWZ0UmVzcG9uc2USMQoFZHJhZnQYASABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQiIwoPR2V0RHJhZnRSZXF1ZXN0EhAKCGRyYWZ0X2lkGAEgASgJIkUKEEdldERyYWZ0UmVzcG9uc2USMQoFZHJhZnQYASABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQicAoSVXBkYXRlRHJhZnRSZXF1ZXN0EhAKCGRyYWZ0X2lkGAEgASgJEjMKB3VwZGF0ZXMYAiABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQSEwoLdXBkYXRlX21hc2sYAyADKAkigQEKE1VwZGF0ZURyYWZ0UmVzcG9uc2USMQoFZHJhZnQYASABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQSNwoId2FybmluZ3MYAiADKAsyJS5kbmQ1ZS5hcGkudjFhbHBoYTEuVmFsaWRhdGlvbldhcm5pbmciMwoRVXBkYXRlTmFtZVJlcXVlc3QSEAoIZHJhZnRfaWQYASABKAkSDAoEbmFtZRgCIAEoCSJ7ChFVcGRhdGVSYWNlUmVxdWVzdBIQCghkcmFmdF9pZBgBIAEoCRImCgRyYWNlGAIgASgOMhguZG5kNWUuYXBpLnYxYWxwaGExLlJhY2USLAoHc3VicmFjZRgDIAEoDjIbLmRuZDVlLmFwaS52MWFscGhhMS5TdWJyYWNlIlAKElVwZGF0ZUNsYXNzUmVxdWVzdBIQCghkcmFmdF9pZBgBIAEoCRIoCgVjbGFzcxgCIAEoDjIZLmRuZDVlLmFwaS52MWFscGhhMS5DbGFzcyJfChdVcGRhdGVCYWNrZ3JvdW5kUmVxdWVzdBIQCghkcmFmdF9pZBgBIAEoCRIyCgpiYWNrZ3JvdW5kGAIgASgOMh4uZG5kNWUuYXBpLnYxYWxwaGExLkJhY2tncm91bmQiaQoaVXBkYXRlQWJpbGl0eVNjb3Jlc1JlcXVlc3QSEAoIZHJhZnRfaWQYASABKAkSOQoOYWJpbGl0eV9zY29yZXMYAiABKAsyIS5kbmQ1ZS5hcGkudjFhbHBoYTEuQWJpbGl0eVNjb3JlcyJSChNVcGRhdGVTa2lsbHNSZXF1ZXN0EhAKCGRyYWZ0X2lkGAEgASgJEikKBnNraWxscxgCIAMoDjIZLmRuZDVlLmFwaS52MWFscGhhMS5Ta2lsbCKAAQoSVXBkYXRlTmFtZVJlc3BvbnNlEjEKBWRyYWZ0GAEgASgLMiIuZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlckRyYWZ0EjcKCHdhcm5pbmdzGAIgAygLMiUuZG5kNWUuYXBpLnYxYWxwaGExLlZhbGlkYXRpb25XYXJuaW5nIoABChJVcGRhdGVSYWNlUmVzcG9uc2USMQoFZHJhZnQYASABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQSNwoId2FybmluZ3MYAiADKAsyJS5kbmQ1ZS5hcGkudjFhbHBoYTEuVmFsaWRhdGlvbldhcm5pbmcigQEKE1VwZGF0ZUNsYXNzUmVzcG9uc2USMQoFZHJhZnQYASABKAsyIi5kbmQ1ZS5hcGkudjFhbHBoYTEuQ2hhcmFjdGVyRHJhZnQSNwoId2FybmluZ3MYAiADKAsyJS5kbmQ1ZS5hcGkudjFhbHBoYTEuVmFsaWRhdGlvbldhcm5pbmcihgEKGFVwZGF0ZUJhY2tncm91bmRSZXNwb25zZRIxCgVkcmFmdBgBIAEoCzIiLmRuZDVlLmFwaS52MWFscGhhMS5DaGFyYWN0ZXJEcmFmdBI3Cgh3YXJuaW5ncxgCIAMoCzIlLmRuZDVlLmFwaS52MWFscGhhMS5WYWxpZGF0aW9uV2FybmluZyKJAQobVXBkYXRlQWJpbGl0eVNjb3Jlc1Jlc3BvbnNlEjEKBWRyYWZ0GAEgASgLMiIuZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlckRyYWZ0EjcKCHdhcm5pbmdzGAIgAygLMiUuZG5kNWUuYXBpLnYxYWxwaGExLlZhbGlkYXRpb25XYXJuaW5nIoIBChRVcGRhdGVTa2lsbHNSZXNwb25zZRIxCgVkcmFmdBgBIAEoCzIiLmRuZDVlLmFwaS52MWFscGhhMS5DaGFyYWN0ZXJEcmFmdBI3Cgh3YXJuaW5ncxgCIAMoCzIlLmRuZDVlLmFwaS52MWFscGhhMS5WYWxpZGF0aW9uV2FybmluZyJhChFMaXN0RHJhZnRzUmVxdWVzdBIRCglwbGF5ZXJfaWQYASABKAkSEgoKc2Vzc2lvbl9pZBgCIAEoCRIRCglwYWdlX3NpemUYAyABKAUSEgoKcGFnZV90b2tlbhgEIAEoCSJhChJMaXN0RHJhZnRzUmVzcG9uc2USMgoGZHJhZnRzGAEgAygLMiIuZG5kNWUuYXBpLnYxYWxwaGExLkNoYXJhY3RlckRyYWZ0EhcKD25leHRfcGFnZV90b2tlbhgCIAEoCSIoChRWYWxpZGF0ZURyYWZ0UmVxdWVzdBIQCghkcmFmdF9pZBgBIAEoCSLlAQoVVmFsaWRhdGVEcmFmdFJlc3BvbnNlEhMKC2lzX2NvbXBsZXRlGAEgASgIEhAKCGlzX3ZhbGlkGAIgASgIEjMKBmVycm9ycxgDIAMoCzIjLmRuZDVlLmFwaS52MWFscGhhMS5WYWxpZGF0aW9uRXJyb3ISNwoId2FybmluZ3MYBCADKAsyJS5kbmQ1ZS5hcGkudjFhbHBoYTEuVmFsaWRhdGlvbldhcm5pbmcSNwoNbWlzc2luZ19zdGVwcxgFIAMoDjIgLmRuZDVlLmFwaS52MWFscGhhMS5DcmVhdGlvblN0ZXAiKAoURmluYWxpemVEcmFmdFJlcXVlc3QSEAoIZHJhZnRfaWQYASABKAkiYAoVRmluYWxpemVEcmFmdFJlc3BvbnNlEjAKCWNoYXJhY3RlchgBIAEoCzIdLmRuZDVlLmFwaS52MWFscGhhMS5DaGFyYWN0ZXISFQoNZHJhZnRfZGVsZXRlZBgCIAEoCCImChJEZWxldGVEcmFmdFJlcXVlc3QSEAoIZHJhZnRfaWQYASABKAkiJgoTRGVsZXRlRHJhZnRSZXNwb25zZRIPCgdtZXNzYWdlGAEgASgJKocCCgxDcmVhdGlvblN0ZXASHQoZQ1JFQVRJT05fU1RFUF9VTlNQRUNJRklFRBAAEhYKEkNSRUFUSU9OX1NURVBfTkFNRRABEhYKEkNSRUFUSU9OX1NURVBfUkFDRRACEhcKE0NSRUFUSU9OX1NURVBfQ0xBU1MQAxIcChhDUkVBVElPTl9TVEVQX0JBQ0tHUk9VTkQQBBIgChxDUkVBVElPTl9TVEVQX0FCSUxJVFlfU0NPUkVTEAUSGAoUQ1JFQVRJT05fU1RFUF9TS0lMTFMQBhIbChdDUkVBVElPTl9TVEVQX0xBTkdVQUdFUxAHEhgKFENSRUFUSU9OX1NURVBfUkVWSUVXEAgqmAEKC1dhcm5pbmdUeXBlEhwKGFdBUk5JTkdfVFlQRV9VTlNQRUNJRklFRBAAEiEKHVdBUk5JTkdfVFlQRV9NSVNTSU5HX1JFUVVJUkVEEAESJAogV0FSTklOR19UWVBFX0lOVkFMSURfQ09NQklOQVRJT04QAhIiCh5XQVJOSU5HX1RZUEVfU1VCT1BUSU1BTF9DSE9JQ0UQAzLuCwoQQ2hhcmFjdGVyU2VydmljZRJeCgtDcmVhdGVEcmFmdBImLmRuZDVlLmFwaS52MWFscGhhMS5DcmVhdGVEcmFmdFJlcXVlc3QaJy5kbmQ1ZS5hcGkudjFhbHBoYTEuQ3JlYXRlRHJhZnRSZXNwb25zZRJVCghHZXREcmFmdBIjLmRuZDVlLmFwaS52MWFscGhhMS5HZXREcmFmdFJlcXVlc3QaJC5kbmQ1ZS5hcGkudjFhbHBoYTEuR2V0RHJhZnRSZXNwb25zZRJbCgpMaXN0RHJhZnRzEiUuZG5kNWUuYXBpLnYxYWxwaGExLkxpc3REcmFmdHNSZXF1ZXN0GiYuZG5kNWUuYXBpLnYxYWxwaGExLkxpc3REcmFmdHNSZXNwb25zZRJeCgtEZWxldGVEcmFmdBImLmRuZDVlLmFwaS52MWFscGhhMS5EZWxldGVEcmFmdFJlcXVlc3QaJy5kbmQ1ZS5hcGkudjFhbHBoYTEuRGVsZXRlRHJhZnRSZXNwb25zZRJbCgpVcGRhdGVOYW1lEiUuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZU5hbWVSZXF1ZXN0GiYuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZU5hbWVSZXNwb25zZRJbCgpVcGRhdGVSYWNlEiUuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZVJhY2VSZXF1ZXN0GiYuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZVJhY2VSZXNwb25zZRJeCgtVcGRhdGVDbGFzcxImLmRuZDVlLmFwaS52MWFscGhhMS5VcGRhdGVDbGFzc1JlcXVlc3QaJy5kbmQ1ZS5hcGkudjFhbHBoYTEuVXBkYXRlQ2xhc3NSZXNwb25zZRJtChBVcGRhdGVCYWNrZ3JvdW5kEisuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZUJhY2tncm91bmRSZXF1ZXN0GiwuZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZUJhY2tncm91bmRSZXNwb25zZRJ2ChNVcGRhdGVBYmlsaXR5U2NvcmVzEi4uZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZUFiaWxpdHlTY29yZXNSZXF1ZXN0Gi8uZG5kNWUuYXBpLnYxYWxwaGExLlVwZGF0ZUFiaWxpdHlTY29yZXNSZXNwb25zZRJhCgxVcGRhdGVTa2lsbHMSJy5kbmQ1ZS5hcGkudjFhbHBoYTEuVXBkYXRlU2tpbGxzUmVxdWVzdBooLmRuZDVlLmFwaS52MWFscGhhMS5VcGRhdGVTa2lsbHNSZXNwb25zZRJkCg1WYWxpZGF0ZURyYWZ0EiguZG5kNWUuYXBpLnYxYWxwaGExLlZhbGlkYXRlRHJhZnRSZXF1ZXN0GikuZG5kNWUuYXBpLnYxYWxwaGExLlZhbGlkYXRlRHJhZnRSZXNwb25zZRJkCg1GaW5hbGl6ZURyYWZ0EiguZG5kNWUuYXBpLnYxYWxwaGExLkZpbmFsaXplRHJhZnRSZXF1ZXN0GikuZG5kNWUuYXBpLnYxYWxwaGExLkZpbmFsaXplRHJhZnRSZXNwb25zZRJhCgxHZXRDaGFyYWN0ZXISJy5kbmQ1ZS5hcGkudjFhbHBoYTEuR2V0Q2hhcmFjdGVyUmVxdWVzdBooLmRuZDVlLmFwaS52MWFscGhhMS5HZXRDaGFyYWN0ZXJSZXNwb25zZRJnCg5MaXN0Q2hhcmFjdGVycxIpLmRuZDVlLmFwaS52MWFscGhhMS5MaXN0Q2hhcmFjdGVyc1JlcXVlc3QaKi5kbmQ1ZS5hcGkudjFhbHBoYTEuTGlzdENoYXJhY3RlcnNSZXNwb25zZRJqCg9EZWxldGVDaGFyYWN0ZXISKi5kbmQ1ZS5hcGkudjFhbHBoYTEuRGVsZXRlQ2hhcmFjdGVyUmVxdWVzdBorLmRuZDVlLmFwaS52MWFscGhhMS5EZWxldGVDaGFyYWN0ZXJSZXNwb25zZULYAQoWY29tLmRuZDVlLmFwaS52MWFscGhhMUIOQ2hhcmFjdGVyUHJvdG9QAVpEZ2l0aHViLmNvbS9LaXJrRGlnZ2xlci9ycGctYXBpLXByb3Rvcy9kbmQ1ZS9hcGkvdjFhbHBoYTE7YXBpdjFhbHBoYTGiAgNEQViqAhJEbmQ1ZS5BcGkuVjFhbHBoYTHKAhJEbmQ1ZVxBcGlcVjFhbHBoYTHiAh5EbmQ1ZVxBcGlcVjFhbHBoYTFcR1BCTWV0YWRhdGHqAhREbmQ1ZTo6QXBpOjpWMWFscGhhMWIGcHJvdG8z", [file_dnd5e_api_v1alpha1_common, file_dnd5e_api_v1alpha1_enums]);
/**
 * Describes the message dnd5e.api.v1alpha1.AbilityScores.
 * Use `create(AbilityScoresSchema)` to create a new message.
 */
export const AbilityScoresSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 0);
/**
 * Describes the message dnd5e.api.v1alpha1.Character.
 * Use `create(CharacterSchema)` to create a new message.
 */
export const CharacterSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 1);
/**
 * Describes the message dnd5e.api.v1alpha1.AbilityModifiers.
 * Use `create(AbilityModifiersSchema)` to create a new message.
 */
export const AbilityModifiersSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 2);
/**
 * Describes the message dnd5e.api.v1alpha1.CombatStats.
 * Use `create(CombatStatsSchema)` to create a new message.
 */
export const CombatStatsSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 3);
/**
 * Describes the message dnd5e.api.v1alpha1.Proficiencies.
 * Use `create(ProficienciesSchema)` to create a new message.
 */
export const ProficienciesSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 4);
/**
 * Describes the message dnd5e.api.v1alpha1.CharacterMetadata.
 * Use `create(CharacterMetadataSchema)` to create a new message.
 */
export const CharacterMetadataSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 5);
/**
 * Describes the message dnd5e.api.v1alpha1.GetCharacterRequest.
 * Use `create(GetCharacterRequestSchema)` to create a new message.
 */
export const GetCharacterRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 6);
/**
 * Describes the message dnd5e.api.v1alpha1.GetCharacterResponse.
 * Use `create(GetCharacterResponseSchema)` to create a new message.
 */
export const GetCharacterResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 7);
/**
 * Describes the message dnd5e.api.v1alpha1.ListCharactersRequest.
 * Use `create(ListCharactersRequestSchema)` to create a new message.
 */
export const ListCharactersRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 8);
/**
 * Describes the message dnd5e.api.v1alpha1.ListCharactersResponse.
 * Use `create(ListCharactersResponseSchema)` to create a new message.
 */
export const ListCharactersResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 9);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateCharacterRequest.
 * Use `create(UpdateCharacterRequestSchema)` to create a new message.
 */
export const UpdateCharacterRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 10);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateCharacterResponse.
 * Use `create(UpdateCharacterResponseSchema)` to create a new message.
 */
export const UpdateCharacterResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 11);
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteCharacterRequest.
 * Use `create(DeleteCharacterRequestSchema)` to create a new message.
 */
export const DeleteCharacterRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 12);
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteCharacterResponse.
 * Use `create(DeleteCharacterResponseSchema)` to create a new message.
 */
export const DeleteCharacterResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 13);
/**
 * Describes the message dnd5e.api.v1alpha1.CharacterDraft.
 * Use `create(CharacterDraftSchema)` to create a new message.
 */
export const CharacterDraftSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 14);
/**
 * Describes the message dnd5e.api.v1alpha1.CreationProgress.
 * Use `create(CreationProgressSchema)` to create a new message.
 */
export const CreationProgressSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 15);
/**
 * Describes the message dnd5e.api.v1alpha1.DraftMetadata.
 * Use `create(DraftMetadataSchema)` to create a new message.
 */
export const DraftMetadataSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 16);
/**
 * Describes the message dnd5e.api.v1alpha1.CreateDraftRequest.
 * Use `create(CreateDraftRequestSchema)` to create a new message.
 */
export const CreateDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 17);
/**
 * Describes the message dnd5e.api.v1alpha1.CreateDraftResponse.
 * Use `create(CreateDraftResponseSchema)` to create a new message.
 */
export const CreateDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 18);
/**
 * Describes the message dnd5e.api.v1alpha1.GetDraftRequest.
 * Use `create(GetDraftRequestSchema)` to create a new message.
 */
export const GetDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 19);
/**
 * Describes the message dnd5e.api.v1alpha1.GetDraftResponse.
 * Use `create(GetDraftResponseSchema)` to create a new message.
 */
export const GetDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 20);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateDraftRequest.
 * Use `create(UpdateDraftRequestSchema)` to create a new message.
 */
export const UpdateDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 21);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateDraftResponse.
 * Use `create(UpdateDraftResponseSchema)` to create a new message.
 */
export const UpdateDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 22);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateNameRequest.
 * Use `create(UpdateNameRequestSchema)` to create a new message.
 */
export const UpdateNameRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 23);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateRaceRequest.
 * Use `create(UpdateRaceRequestSchema)` to create a new message.
 */
export const UpdateRaceRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 24);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateClassRequest.
 * Use `create(UpdateClassRequestSchema)` to create a new message.
 */
export const UpdateClassRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 25);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateBackgroundRequest.
 * Use `create(UpdateBackgroundRequestSchema)` to create a new message.
 */
export const UpdateBackgroundRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 26);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateAbilityScoresRequest.
 * Use `create(UpdateAbilityScoresRequestSchema)` to create a new message.
 */
export const UpdateAbilityScoresRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 27);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateSkillsRequest.
 * Use `create(UpdateSkillsRequestSchema)` to create a new message.
 */
export const UpdateSkillsRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 28);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateNameResponse.
 * Use `create(UpdateNameResponseSchema)` to create a new message.
 */
export const UpdateNameResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 29);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateRaceResponse.
 * Use `create(UpdateRaceResponseSchema)` to create a new message.
 */
export const UpdateRaceResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 30);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateClassResponse.
 * Use `create(UpdateClassResponseSchema)` to create a new message.
 */
export const UpdateClassResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 31);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateBackgroundResponse.
 * Use `create(UpdateBackgroundResponseSchema)` to create a new message.
 */
export const UpdateBackgroundResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 32);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateAbilityScoresResponse.
 * Use `create(UpdateAbilityScoresResponseSchema)` to create a new message.
 */
export const UpdateAbilityScoresResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 33);
/**
 * Describes the message dnd5e.api.v1alpha1.UpdateSkillsResponse.
 * Use `create(UpdateSkillsResponseSchema)` to create a new message.
 */
export const UpdateSkillsResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 34);
/**
 * Describes the message dnd5e.api.v1alpha1.ListDraftsRequest.
 * Use `create(ListDraftsRequestSchema)` to create a new message.
 */
export const ListDraftsRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 35);
/**
 * Describes the message dnd5e.api.v1alpha1.ListDraftsResponse.
 * Use `create(ListDraftsResponseSchema)` to create a new message.
 */
export const ListDraftsResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 36);
/**
 * Describes the message dnd5e.api.v1alpha1.ValidateDraftRequest.
 * Use `create(ValidateDraftRequestSchema)` to create a new message.
 */
export const ValidateDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 37);
/**
 * Describes the message dnd5e.api.v1alpha1.ValidateDraftResponse.
 * Use `create(ValidateDraftResponseSchema)` to create a new message.
 */
export const ValidateDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 38);
/**
 * Describes the message dnd5e.api.v1alpha1.FinalizeDraftRequest.
 * Use `create(FinalizeDraftRequestSchema)` to create a new message.
 */
export const FinalizeDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 39);
/**
 * Describes the message dnd5e.api.v1alpha1.FinalizeDraftResponse.
 * Use `create(FinalizeDraftResponseSchema)` to create a new message.
 */
export const FinalizeDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 40);
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteDraftRequest.
 * Use `create(DeleteDraftRequestSchema)` to create a new message.
 */
export const DeleteDraftRequestSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 41);
/**
 * Describes the message dnd5e.api.v1alpha1.DeleteDraftResponse.
 * Use `create(DeleteDraftResponseSchema)` to create a new message.
 */
export const DeleteDraftResponseSchema = /*@__PURE__*/ messageDesc(file_dnd5e_api_v1alpha1_character, 42);
/**
 * Steps in character creation
 *
 * @generated from enum dnd5e.api.v1alpha1.CreationStep
 */
export var CreationStep;
(function (CreationStep) {
    /**
     * @generated from enum value: CREATION_STEP_UNSPECIFIED = 0;
     */
    CreationStep[CreationStep["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    /**
     * @generated from enum value: CREATION_STEP_NAME = 1;
     */
    CreationStep[CreationStep["NAME"] = 1] = "NAME";
    /**
     * @generated from enum value: CREATION_STEP_RACE = 2;
     */
    CreationStep[CreationStep["RACE"] = 2] = "RACE";
    /**
     * @generated from enum value: CREATION_STEP_CLASS = 3;
     */
    CreationStep[CreationStep["CLASS"] = 3] = "CLASS";
    /**
     * @generated from enum value: CREATION_STEP_BACKGROUND = 4;
     */
    CreationStep[CreationStep["BACKGROUND"] = 4] = "BACKGROUND";
    /**
     * @generated from enum value: CREATION_STEP_ABILITY_SCORES = 5;
     */
    CreationStep[CreationStep["ABILITY_SCORES"] = 5] = "ABILITY_SCORES";
    /**
     * @generated from enum value: CREATION_STEP_SKILLS = 6;
     */
    CreationStep[CreationStep["SKILLS"] = 6] = "SKILLS";
    /**
     * @generated from enum value: CREATION_STEP_LANGUAGES = 7;
     */
    CreationStep[CreationStep["LANGUAGES"] = 7] = "LANGUAGES";
    /**
     * @generated from enum value: CREATION_STEP_REVIEW = 8;
     */
    CreationStep[CreationStep["REVIEW"] = 8] = "REVIEW";
})(CreationStep || (CreationStep = {}));
/**
 * Describes the enum dnd5e.api.v1alpha1.CreationStep.
 */
export const CreationStepSchema = /*@__PURE__*/ enumDesc(file_dnd5e_api_v1alpha1_character, 0);
/**
 * @generated from enum dnd5e.api.v1alpha1.WarningType
 */
export var WarningType;
(function (WarningType) {
    /**
     * @generated from enum value: WARNING_TYPE_UNSPECIFIED = 0;
     */
    WarningType[WarningType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    /**
     * @generated from enum value: WARNING_TYPE_MISSING_REQUIRED = 1;
     */
    WarningType[WarningType["MISSING_REQUIRED"] = 1] = "MISSING_REQUIRED";
    /**
     * @generated from enum value: WARNING_TYPE_INVALID_COMBINATION = 2;
     */
    WarningType[WarningType["INVALID_COMBINATION"] = 2] = "INVALID_COMBINATION";
    /**
     * @generated from enum value: WARNING_TYPE_SUBOPTIMAL_CHOICE = 3;
     */
    WarningType[WarningType["SUBOPTIMAL_CHOICE"] = 3] = "SUBOPTIMAL_CHOICE";
})(WarningType || (WarningType = {}));
/**
 * Describes the enum dnd5e.api.v1alpha1.WarningType.
 */
export const WarningTypeSchema = /*@__PURE__*/ enumDesc(file_dnd5e_api_v1alpha1_character, 1);
/**
 * Service for D&D 5e character creation and management
 * Supports both wizard-style step-by-step creation and free-form editing
 *
 * @generated from service dnd5e.api.v1alpha1.CharacterService
 */
export const CharacterService = /*@__PURE__*/ serviceDesc(file_dnd5e_api_v1alpha1_character, 0);
