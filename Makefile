.PHONY: migrate-types test build


migrate-types:
	@if [ -x ./scripts/generateTypes.sh ]; then \
		echo "Generating types..."; \
		./scripts/generateTypes.sh; \
	else \
		echo "Changing permissions... \n Generating types..."; \
		chmod +x ./scripts/generateTypes.sh; \
		./scripts/generateTypes.sh; \
	fi

test:
	@anchor test

build:
	@anchor build

deploy-programs-mint:
	@anchor run createAndMintToken

initialize-staking-pool:
	@anchor run initializePool

transfer-token:
	@anchor run transferTokens

start-client:
	@cd app && bun run dev

update-program-staker:
	@anchor upgrade target/deploy/stake_tokens.so --program-id 7a8fBQMwbtE1C61fcGUW6quAgdqdmzYojha5cQq9Ju4q
	@# 7a8fBQMwbtE1C61fcGUW6quAgdqdmzYojha5cQq9Ju4q