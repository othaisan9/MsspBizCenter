import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  buildTaskDescPrompt(title: string, tags?: string[], priority?: string): { system: string; user: string } {
    return {
      system: `당신은 업무 관리 전문가입니다. 사용자가 제공한 업무 제목을 바탕으로 구체적이고 실행 가능한 업무 설명을 작성해주세요.
설명은 다음을 포함해야 합니다:
- 업무의 목적과 배경
- 주요 작업 내용 (체크리스트 형식)
- 예상 산출물
- 주의사항 (있다면)

간결하고 명확하게 작성하되, 실무에 바로 적용할 수 있도록 구체적으로 작성해주세요.`,
      user: `업무 제목: ${title}${tags ? `\n태그: ${tags.join(', ')}` : ''}${priority ? `\n우선순위: ${priority}` : ''}\n\n위 업무에 대한 상세 설명을 작성해주세요.`,
    };
  }

  buildMeetingSummaryPrompt(content: string, attendees?: string[]): { system: string; user: string } {
    return {
      system: `당신은 회의록 요약 전문가입니다. 제공된 회의록을 읽고 핵심 내용을 요약해주세요.
요약은 다음 구조로 작성해주세요:
1. 회의 주제 및 목적 (1-2문장)
2. 주요 논의 사항 (불릿 포인트)
3. 결정 사항 (불릿 포인트)
4. 후속 조치 (Action Items, 있다면)

명확하고 간결하게, 핵심만 추출해주세요.`,
      user: `${attendees && attendees.length > 0 ? `참석자: ${attendees.join(', ')}\n\n` : ''}회의록 내용:\n${content}\n\n위 회의록을 요약해주세요.`,
    };
  }

  buildMyPerformancePrompt(tasks: { status: string; title: string; priority?: string }[]): { system: string; user: string } {
    const taskSummary = tasks.map(t => `- [${t.status}] ${t.title} (우선순위: ${t.priority || '없음'})`).join('\n');

    return {
      system: `당신은 업무 성과 분석 전문가입니다. 사용자의 최근 업무 데이터를 분석하여 다음을 제공해주세요:
1. 전반적인 업무 진행 상황 요약
2. 완료된 업무의 특징 및 강점
3. 진행 중인 업무의 현황
4. 개선이 필요한 부분 (있다면)
5. 다음 주 집중 사항 제안

긍정적이고 건설적인 톤으로 작성하되, 객관적인 데이터 기반으로 분석해주세요.`,
      user: `내 최근 업무 목록:\n${taskSummary}\n\n위 데이터를 바탕으로 내 업무 성과를 분석해주세요.`,
    };
  }

  buildWeeklyReportPrompt(tasks: { status: string; title: string; priority?: string; assignee?: { name: string } | null }[], year: number, week: number): { system: string; user: string } {
    const taskSummary = tasks.map(t =>
      `- [${t.status}] ${t.title} (담당: ${t.assignee?.name || '미정'}, 우선순위: ${t.priority || '없음'})`
    ).join('\n');

    return {
      system: `당신은 주간 업무 보고서 작성 전문가입니다. 팀의 주간 업무 데이터를 분석하여 경영진에게 보고할 주간 리포트를 작성해주세요.
리포트 구조:
1. Executive Summary (핵심 요약, 2-3문장)
2. 주요 성과 (Key Achievements)
3. 진행 중인 작업 (In Progress)
4. 이슈 및 리스크 (Issues & Risks, 있다면)
5. 다음 주 계획 (Next Week Plan)

전문적이고 간결하게, 의사결정에 도움이 되는 인사이트를 포함해주세요.`,
      user: `${year}년 ${week}주차 팀 업무 현황:\n${taskSummary}\n\n위 데이터를 바탕으로 주간 보고서를 작성해주세요.`,
    };
  }

  buildActionItemExtractionPrompt(content: string, agenda?: string): { system: string; user: string } {
    return {
      system: `당신은 회의록에서 실행 항목(Action Items)을 추출하는 전문가입니다.
회의록에서 다음 정보를 가진 실행 항목을 JSON 배열로 추출해주세요:
- title: 실행 항목 제목 (간결하게)
- assignee: 담당자 이름 (명시되지 않았으면 null)
- dueDate: 마감일 (YYYY-MM-DD 형식, 명시되지 않았으면 null)
- priority: 우선순위 (high/medium/low, 명시되지 않았으면 'medium')

응답은 반드시 다음 형식의 JSON 배열로만 작성하세요:
[
  { "title": "...", "assignee": "...", "dueDate": "2026-02-15", "priority": "high" }
]

실행 항목이 없으면 빈 배열 []을 반환하세요.`,
      user: `${agenda ? `회의 안건: ${agenda}\n\n` : ''}회의록 내용:\n${content}\n\nAction Items를 JSON 배열로 추출해주세요.`,
    };
  }

  buildExtractWeeklyTasksPrompt(reportText: string, year: number, weekNumber: number): { system: string; user: string } {
    const nextWeek = weekNumber >= 53 ? 1 : weekNumber + 1;
    const nextYear = weekNumber >= 53 ? year + 1 : year;

    return {
      system: `당신은 주간 보고서에서 다음 주 실행 업무를 추출하는 전문가입니다.
주간 보고서의 "다음 주 계획" 또는 "Next Week Plan" 섹션을 중심으로, 보고서 전체에서 후속 조치가 필요한 항목까지 포함하여 구체적인 업무 목록을 JSON 배열로 추출해주세요.

각 업무는 다음 필드를 포함합니다:
- title: 업무 제목 (간결하고 명확하게, 50자 이내)
- description: 업무 설명 (1-2문장, 구체적인 실행 내용)
- priority: 우선순위 (critical/high/medium/low)
- tags: 관련 태그 배열 (예: ["보안관제", "개발"])

반드시 다음 형식의 JSON 배열로만 응답하세요:
[
  { "title": "...", "description": "...", "priority": "medium", "tags": ["..."] }
]

업무가 없으면 빈 배열 []을 반환하세요. 최대 10개까지만 추출하세요.`,
      user: `${year}년 ${weekNumber}주차 주간 보고서:\n\n${reportText}\n\n위 보고서에서 ${nextYear}년 ${nextWeek}주차에 수행할 업무를 JSON 배열로 추출해주세요.`,
    };
  }

  buildMeetingTemplatePrompt(title: string, type?: string, attendeeCount?: number): { system: string; user: string } {
    return {
      system: `당신은 회의 진행 전문가입니다. 효과적인 회의를 위한 템플릿을 작성해주세요.
템플릿에는 다음이 포함되어야 합니다:
1. 회의 목적 (Purpose)
2. 안건 (Agenda) - 시간 배분 포함
3. 준비 사항 (Preparation)
4. 회의록 양식 (Meeting Notes Template)

실무에 바로 활용할 수 있도록 구체적이고 구조화된 형태로 작성해주세요.`,
      user: `회의 제목: ${title}${type ? `\n회의 유형: ${type}` : ''}${attendeeCount ? `\n예상 참석자 수: ${attendeeCount}명` : ''}\n\n위 회의를 위한 템플릿을 작성해주세요.`,
    };
  }

  buildChatPrompt(message: string, contextData?: {
    myTasks?: any[];
    allTasks?: any[];
    meetings?: any[];
    contracts?: any[];
    stats?: any;
  }): { system: string; user: string } {
    const sections: string[] = [];

    // 대시보드 통계
    if (contextData?.stats) {
      const s = contextData.stats;
      sections.push(`[대시보드 통계]
- 전체 업무: ${s.totalTasks ?? 0}개, 이번 주 완료: ${s.completedThisWeek ?? 0}개, 진행 중: ${s.inProgressTasks ?? 0}개
- 전체 회의: ${s.totalMeetings ?? 0}개
- 계약: 전체 ${s.totalContracts ?? 0}개, 활성 ${s.activeContracts ?? 0}개, 만료 임박 ${s.expiringContracts ?? 0}개`);
    }

    // 내 업무
    if (contextData?.myTasks && contextData.myTasks.length > 0) {
      const taskLines = contextData.myTasks.map(t =>
        `- [${t.status}] ${t.title} (우선순위: ${t.priority || '-'}, 주차: ${t.year}/${t.weekNumber}주${t.dueDate ? `, 완료예정: ${t.dueDate.split('T')[0]}` : ''}${t.tags?.length ? `, 태그: ${t.tags.join(',')}` : ''})`
      );
      sections.push(`[내 담당 업무 (${contextData.myTasks.length}개)]\n${taskLines.join('\n')}`);
    }

    // 전체 업무 (내 업무와 다른 것만 요약)
    if (contextData?.allTasks && contextData.allTasks.length > 0) {
      const myIds = new Set((contextData.myTasks || []).map((t: any) => t.id));
      const otherTasks = contextData.allTasks.filter((t: any) => !myIds.has(t.id));
      if (otherTasks.length > 0) {
        const taskLines = otherTasks.slice(0, 30).map((t: any) =>
          `- [${t.status}] ${t.title} (담당: ${t.assignee?.name || '미정'}, 우선순위: ${t.priority || '-'})`
        );
        sections.push(`[팀 전체 업무 (${otherTasks.length}개)]\n${taskLines.join('\n')}`);
      }
    }

    // 회의록
    if (contextData?.meetings && contextData.meetings.length > 0) {
      const meetingLines = contextData.meetings.map((m: any) =>
        `- [${m.status}] ${m.title} (일시: ${m.meetingDate?.split('T')[0] || '-'}${m.attendees?.length ? `, 참석: ${m.attendees.length}명` : ''})`
      );
      sections.push(`[최근 회의 (${contextData.meetings.length}개)]\n${meetingLines.join('\n')}`);
    }

    // 계약
    if (contextData?.contracts && contextData.contracts.length > 0) {
      const contractLines = contextData.contracts.map((c: any) =>
        `- [${c.status}] ${c.customerName} - ${c.title} (${c.contractType || '-'}, 기간: ${c.startDate?.split('T')[0] || '?'} ~ ${c.endDate?.split('T')[0] || '?'})`
      );
      sections.push(`[계약 현황 (${contextData.contracts.length}개)]\n${contractLines.join('\n')}`);
    }

    const contextStr = sections.length > 0
      ? `\n\n--- 아래는 현재 시스템에 등록된 실제 데이터입니다. 이 데이터를 기반으로 답변해주세요. ---\n\n${sections.join('\n\n')}`
      : '';

    return {
      system: `당신은 MSSP(Managed Security Service Provider) 비즈니스 센터의 AI 어시스턴트입니다.
사용자가 질문하면 아래 제공되는 실제 프로젝트 데이터를 기반으로 정확하게 답변해야 합니다.

역할:
- 업무(Task) 현황 조회, 분석, 조언
- 회의록(Meeting) 요약, 결정사항 안내
- 계약(Contract) 현황, 만료 임박 계약 알림
- 팀 성과 분석 및 업무 우선순위 제안
- 데이터 기반 인사이트 제공

규칙:
- 반드시 제공된 데이터에 근거하여 답변하세요
- 데이터에 없는 내용은 "현재 데이터에서 확인되지 않습니다"라고 명확히 알려주세요
- 숫자나 통계를 말할 때는 실제 데이터를 인용하세요
- 한국어로 친절하고 전문적으로 답변하세요`,
      user: `${message}${contextStr}`,
    };
  }
}
