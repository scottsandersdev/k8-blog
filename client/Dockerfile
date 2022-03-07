FROM node:16-alpine
 
# new!!
ENV CI=true
 
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./ ./
 
CMD ["npm", "start"]