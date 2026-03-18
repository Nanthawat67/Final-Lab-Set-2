# ใช้ Node.js official image
FROM node:18

# สร้าง working directory ใน container
WORKDIR /app

# copy package.json ก่อนเพื่อ cache dependency
COPY package.json .

# install dependencies
RUN npm install

# copy source code ทั้งหมด
COPY . .

# expose port ของ service
EXPOSE 3001

# start server
CMD ["node", "src/index.js"]