FROM node:20-alpine

RUN apk add --no-cache \
	openssl \
	libc6-compat \
	mariadb-client \
	netcat-openbsd \
	python3 \
	py3-pip \
	py3-virtualenv \
	py3-cffi \
	py3-pillow \
	cairo \
	pango \
	gdk-pixbuf \
	libffi \
	fontconfig \
	freetype \
	harfbuzz \
	ttf-dejavu

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN python3 -m venv /opt/venv \
	&& /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
	&& /opt/venv/bin/pip install --no-cache-dir WeasyPrint

EXPOSE 3000
CMD ["sh", "-c", "npm install && npx prisma generate --schema prisma/schema.prisma && npx tsx src/app.ts"]