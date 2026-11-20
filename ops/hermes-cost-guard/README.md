# Hermes cost guard

On 20 November 2026, the Classai key used by Hermes had 868 requests and
866 million credits of usage in seven days. The account's two keys together
had 872 requests and 867 million credits of usage. The key can be shared by
other DKH tools, so those figures are not exclusively attributable to Hermes.
Many requests had 200,000–300,000 input tokens. Railway logs showed repeated
`thread=bg-review` calls using paid `deepseek-v4.1-flash-1017`; Hermes' own
source describes an automatic post-turn review that replays conversation
context. This is a confirmed source of extra calls, though its exact share of
the Classai bill has not been measured.

The Railway `hermes-social` Console was used to set
`auxiliary.background_review.enabled: false` for the main config and every
existing agent config. Twelve config files were verified as disabled. These
files are on the persistent `/opt/data` volume. Manual knowledge updates and
the normal uploader work remain available. The feature's automatic review
after each turn is disabled.

If the setting must be re-applied after a new profile is created, run
[`disable-background-review.sh`](disable-background-review.sh) in the
`hermes-social` Railway Console and inspect the output. Never print full
config files, because they may contain API keys. The Railway start command is
the original `/usr/local/bin/ruang-hermes-entrypoint.sh`; a previous attempt
to run a Python guard before that command did not change the profile configs
and was reverted.

This guard does not trim existing chat history or cap Classai spending.
The Grok bridge already gives each upload task a fresh Hermes session. Keep
watching Classai usage after real upload runs; compare input tokens per upload
and check for new `thread=bg-review` logs. Do not publish a brand post solely
to measure token savings.
