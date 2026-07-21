DOCKER_COMPOSE_PATH = $(HOME)/Desktop/projects/ft_transcendence/devops
COMPOSE_FILE = $(DOCKER_COMPOSE_PATH)/docker-compose.yml

.PHONY: all up down

all: up

up:
	mkdir -p "$(HOME)/Desktop/projects/volumes/postgres_db"
	docker compose -f "$(COMPOSE_FILE)" up -d

down:
	docker compose -f "$(COMPOSE_FILE)" down
