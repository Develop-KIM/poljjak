<script setup lang="ts">
useSeoMeta({
  title: '개인정보처리방침',
  description: '폴짝 서비스의 개인정보 수집·이용·보관 방침을 안내합니다.',
  ogTitle: '개인정보처리방침 · 폴짝',
  ogUrl: 'https://poljjak.kr/privacy',
})
</script>

<template>
  <div class="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16">
    <h1 class="text-3xl font-black text-foreground">개인정보처리방침</h1>
    <p class="mt-3 text-sm text-muted-foreground">시행일: 2026년 5월 21일</p>

    <p class="mt-8 text-sm leading-7 text-muted-foreground">
      폴짝(이하 "서비스")은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을
      준수합니다. 본 방침은 서비스가 어떤 정보를 수집하고, 어떻게 이용하며, 어떻게 보호하는지
      안내합니다.
    </p>

    <!-- 1 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">1. 수집하는 개인정보 항목</h2>
      <div class="mt-4 rounded-lg border border-border p-5 text-sm leading-7 text-muted-foreground">
        <p class="font-semibold text-foreground">카카오 OAuth 로그인 시 수집</p>
        <ul class="mt-2 list-inside list-disc space-y-1">
          <li>카카오 회원 고유 식별자</li>
          <li>닉네임</li>
          <li>프로필 사진 URL</li>
          <li>이메일 주소 (제공 동의 시)</li>
        </ul>
        <p class="mt-4 font-semibold text-foreground">구글 OAuth 로그인 시 수집</p>
        <ul class="mt-2 list-inside list-disc space-y-1">
          <li>구글 회원 고유 식별자</li>
          <li>이름</li>
          <li>프로필 사진 URL</li>
          <li>이메일 주소</li>
        </ul>
        <p class="mt-4 font-semibold text-foreground">서비스 이용 과정에서 자동 수집</p>
        <ul class="mt-2 list-inside list-disc space-y-1">
          <li>서비스 이용 기록, 접속 로그</li>
          <li>업로드한 포트폴리오 PDF 파일 (분석 후 서버에 보관)</li>
          <li>작성한 게시글, 댓글 내용</li>
        </ul>
      </div>
    </section>

    <!-- 2 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">2. 개인정보 수집 및 이용 목적</h2>
      <ul class="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          회원 가입 및 본인 확인, 서비스 이용 자격 관리
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          AI 포트폴리오 분석 서비스 제공 및 분석 결과 저장
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          커뮤니티 서비스 제공 (게시글, 댓글, 1:1 채팅)
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          신고 처리 및 서비스 부정 이용 방지
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          서비스 개선을 위한 통계 분석
        </li>
      </ul>
    </section>

    <!-- 3 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">3. 개인정보 보유 및 이용 기간</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        회원 탈퇴 시 즉시 파기하는 것을 원칙으로 합니다. 단, 탈퇴 신청 후
        <strong class="text-foreground">30일간 유예 기간</strong>을 두며, 이 기간 내 재가입 시
        데이터를 복원할 수 있습니다. 30일 경과 후에는 모든 개인정보를 영구 삭제합니다.
      </p>
      <p class="mt-3 text-sm leading-7 text-muted-foreground">
        단, 관계 법령에 의해 보존 의무가 있는 정보는 해당 기간 동안 보관합니다.
      </p>
      <div class="mt-4 rounded-lg border border-border p-5 text-sm text-muted-foreground">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="pb-3 text-left text-xs font-semibold text-foreground">보존 항목</th>
              <th class="pb-3 text-left text-xs font-semibold text-foreground">보존 기간</th>
              <th class="pb-3 text-left text-xs font-semibold text-foreground">근거 법령</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="py-3">계약·청약 관련 기록</td>
              <td class="py-3">5년</td>
              <td class="py-3">전자상거래법</td>
            </tr>
            <tr>
              <td class="py-3">접속 로그</td>
              <td class="py-3">3개월</td>
              <td class="py-3">통신비밀보호법</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 4 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">4. 개인정보 제3자 제공</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        서비스는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의해
        수사기관 등에 제공이 요구되는 경우는 예외로 합니다.
      </p>
    </section>

    <!-- 5 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">5. 개인정보 처리 위탁</h2>
      <div class="mt-4 rounded-lg border border-border p-5 text-sm text-muted-foreground">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="pb-3 text-left text-xs font-semibold text-foreground">수탁 업체</th>
              <th class="pb-3 text-left text-xs font-semibold text-foreground">위탁 업무</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="py-3">Supabase Inc.</td>
              <td class="py-3">데이터베이스 및 인증 서비스 운영</td>
            </tr>
            <tr>
              <td class="py-3">Vercel Inc.</td>
              <td class="py-3">서비스 호스팅</td>
            </tr>
            <tr>
              <td class="py-3">NAVER Cloud (CLOVA Studio)</td>
              <td class="py-3">AI 포트폴리오 분석 처리</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 6 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">6. 이용자 권리</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        이용자는 언제든지 다음 권리를 행사할 수 있습니다.
      </p>
      <ul class="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          개인정보 열람, 정정, 삭제 요청
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          개인정보 처리 정지 요청
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          마이페이지 내 회원 탈퇴를 통한 개인정보 삭제
        </li>
      </ul>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        권리 행사 문의: <strong class="text-foreground">kimdonghwan913@gmail.com</strong>
      </p>
    </section>

    <!-- 7 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">7. 개인정보보호 책임자</h2>
      <div class="mt-4 rounded-lg border border-border p-5 text-sm leading-7 text-muted-foreground">
        <p><span class="font-semibold text-foreground">성명:</span> 김동환</p>
        <p><span class="font-semibold text-foreground">이메일:</span> kimdonghwan913@gmail.com</p>
      </div>
    </section>

    <!-- 8 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">8. 개인정보처리방침 변경</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        본 방침은 법령·정책 변경 또는 서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 공지를
        통해 7일 전 사전 고지합니다.
      </p>
    </section>

    <p class="mt-12 text-xs text-muted-foreground/60">
      공고일: 2026년 5월 21일 · 시행일: 2026년 5월 21일
    </p>
  </div>
</template>
