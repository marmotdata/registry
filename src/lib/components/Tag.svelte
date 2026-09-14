<!--
  The one tag primitive. Every pill in the registry (category, feature,
  status, field type, version) renders through this so sizing, radius and
  colour stay consistent.

  tone   colour family; neutral by default, tints for status/semantic use
  size   sm (cards, dense tables) | md (page headers)
  dot    leading colour dot instead of an icon — good for status
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Tone } from '$lib/taxonomy';

	interface Props {
		tone?: Tone;
		size?: 'sm' | 'md';
		dot?: boolean;
		mono?: boolean;
		title?: string;
		icon?: Snippet;
		children: Snippet;
	}

	let { tone = 'neutral', size = 'sm', dot = false, mono = false, title, icon, children }: Props =
		$props();

	const TONES: Record<Tone, string> = {
		neutral: 'border-line bg-surface-2 text-ink-muted',
		blue: 'border-earthy-blue-300/70 bg-earthy-blue-100 text-earthy-blue-900 dark:border-earthy-blue-700/40 dark:bg-earthy-blue-900/30 dark:text-earthy-blue-300',
		green:
			'border-earthy-green-300/70 bg-earthy-green-100 text-earthy-green-900 dark:border-earthy-green-700/40 dark:bg-earthy-green-900/30 dark:text-earthy-green-300',
		amber:
			'border-earthy-yellow-400/60 bg-earthy-yellow-100 text-[#7a5a12] dark:border-earthy-yellow-700/40 dark:bg-earthy-yellow-900/25 dark:text-earthy-yellow-400',
		red: 'border-red-300/70 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300',
		accent:
			'border-earthy-terracotta-200 bg-accent-soft text-accent-ink dark:border-earthy-terracotta-800/50'
	};

	const DOTS: Record<Tone, string> = {
		neutral: 'bg-ink-subtle',
		blue: 'bg-earthy-blue-600 dark:bg-earthy-blue-400',
		green: 'bg-earthy-green-600 dark:bg-earthy-green-400',
		amber: 'bg-earthy-yellow-700 dark:bg-earthy-yellow-500',
		red: 'bg-red-500 dark:bg-red-400',
		accent: 'bg-accent'
	};

	const SIZES = {
		sm: 'h-7 px-2 text-xs gap-1.5',
		md: 'h-8 px-3 text-sm gap-2'
	};
</script>

<span
	{title}
	class="inline-flex items-center rounded-md border font-medium leading-none whitespace-nowrap {TONES[
		tone
	]} {SIZES[size]} {mono ? 'font-mono' : ''}"
>
	{#if dot}
		<span class="h-1.5 w-1.5 flex-shrink-0 rounded-full {DOTS[tone]}" aria-hidden="true"></span>
	{:else if icon}
		<span class="flex-shrink-0 opacity-80 [&>svg]:h-3.5 [&>svg]:w-3.5">{@render icon()}</span>
	{/if}
	{@render children()}
</span>
