<script setup lang="ts">
useSeoMeta({
  title: '이용약관',
  description: '폴짝 서비스 이용 조건 및 이용자와 서비스 제공자 간의 권리·의무를 규정합니다.',
  ogTitle: '이용약관 · 폴짝',
  ogUrl: 'https://poljjak.kr/terms',
})
</script>

<template>
  <div class="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16">
    <h1 class="text-3xl font-black text-foreground">이용약관</h1>
    <p class="mt-3 text-sm text-muted-foreground">시행일: 2026년 5월 21일</p>

    <p class="mt-8 text-sm leading-7 text-muted-foreground">
      본 약관은 폴짝(이하 "서비스")의 이용 조건 및 절차, 서비스 제공자와 이용자 간의 권리·의무를
      규정합니다. 서비스를 이용하시면 본 약관에 동의한 것으로 간주합니다.
    </p>

    <!-- 1 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제1조 (목적)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        본 약관은 폴짝이 제공하는 AI 포트폴리오 분석 및 커뮤니티 서비스의 이용과 관련하여 서비스
        제공자와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
      </p>
    </section>

    <!-- 2 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제2조 (서비스 내용)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">서비스는 다음 기능을 제공합니다.</p>
      <ul class="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          PDF 포트폴리오 업로드 및 AI 기반 분석 (이슈 우선순위 분석, Before/After 개선안, 총점)
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          분석 결과 저장 및 공유 링크 생성
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          커뮤니티 게시판 (피드백, 프로젝트 모집, 스터디 모집)
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          회원 간 1:1 채팅
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          국내외 기술 블로그 및 IT 뉴스 아티클 큐레이션 (외부 RSS 피드 기반)
        </li>
      </ul>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        서비스는 운영상·기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경·중단할 수 있으며,
        이 경우 사전에 공지합니다.
      </p>
    </section>

    <!-- 3 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제3조 (회원 가입 및 탈퇴)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        서비스는 카카오 및 구글 OAuth 방식의 소셜 로그인을 지원합니다. 만 14세 미만은 서비스를
        이용할 수 없습니다.
      </p>
      <p class="mt-3 text-sm leading-7 text-muted-foreground">
        회원은 마이페이지에서 탈퇴 신청을 할 수 있습니다. 탈퇴 시 이메일, 프로필 이미지 등
        개인정보성 필드는 익명화되며, 30일 이내 같은 OAuth 계정으로 재로그인하면 기존 활동 기록과
        연결된 계정을 복구할 수 있습니다. 30일이 지나면 계정 정보와 분석 PDF, 프로필 이미지는 영구
        삭제됩니다.
      </p>
    </section>

    <!-- 4 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제4조 (이용자의 의무)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        이용자는 다음 행위를 해서는 안 됩니다.
      </p>
      <ul class="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          타인의 개인정보를 무단으로 수집·사용하는 행위
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          음란, 폭력적, 혐오적인 내용을 게시하는 행위
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          허위 사실을 유포하거나 타인의 명예를 훼손하는 행위
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          스팸, 광고성 게시물을 작성하는 행위
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          서비스의 정상적인 운영을 방해하는 행위
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
          저작권 등 타인의 지식재산권을 침해하는 행위
        </li>
      </ul>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        위반 시 서비스는 사전 통보 없이 이용을 제한하거나 계정을 삭제할 수 있습니다.
      </p>
    </section>

    <!-- 5 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제5조 (게시물의 저작권)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        이용자가 서비스에 게시한 콘텐츠(게시글, 댓글, 이미지 등)의 저작권은 해당 이용자에게
        있습니다. 다만, 이용자는 서비스가 해당 콘텐츠를 서비스 운영 및 개선 목적으로 사용할 수
        있도록 비독점적·무상·전 세계적 이용 권한을 서비스에 부여합니다.
      </p>
      <p class="mt-3 text-sm leading-7 text-muted-foreground">
        서비스가 이용자의 포트폴리오 PDF를 분석하는 과정에서 생성된 AI 분석 결과물은 해당 이용자가
        자유롭게 활용할 수 있습니다. 다만, 서비스는 서비스 품질 개선 목적으로 해당 결과물을
        익명화하여 활용할 수 있습니다.
      </p>
    </section>

    <!-- 6 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제6조 (서비스 이용 제한)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        서비스 이용은 로그인이 필요합니다. 로그인 후에는 이용 횟수 제한 없이 AI 포트폴리오 분석을
        포함한 모든 서비스를 이용할 수 있습니다.
      </p>
    </section>

    <!-- 7 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제7조 (면책 조항)</h2>
      <ul class="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          서비스는 AI 분석 결과의 정확성·완전성을 보증하지 않습니다. 분석 결과는 참고용으로만
          활용하시기 바랍니다.
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          이용자 간 커뮤니티 활동에서 발생하는 분쟁에 대해 서비스는 책임을 지지 않습니다.
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          아티클 섹션에서 제공되는 콘텐츠는 외부 RSS 피드를 통해 수집된 제3자 저작물입니다. 해당
          콘텐츠의 정확성·적법성에 대한 책임은 원출처에 있으며, 서비스는 이에 대해 책임을 지지
          않습니다. 저작권 관련 문제 발생 시 폴짝팀(kimdonghwan913@gmail.com)으로 신고해 주시면 즉시
          조치합니다.
        </li>
        <li class="flex gap-2">
          <span class="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          천재지변, 인프라 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
        </li>
      </ul>
    </section>

    <!-- 8 -->
    <section class="mt-10">
      <h2 class="text-lg font-black text-foreground">제8조 (준거법 및 관할)</h2>
      <p class="mt-4 text-sm leading-7 text-muted-foreground">
        본 약관은 대한민국 법령에 따라 해석되며, 서비스와 이용자 간 분쟁에 관한 소송은 민사소송법상
        관할 법원을 제1심 관할 법원으로 합니다.
      </p>
    </section>

    <p class="mt-12 text-xs text-muted-foreground/60">
      공고일: 2026년 5월 21일 · 시행일: 2026년 5월 21일
    </p>
  </div>
</template>
