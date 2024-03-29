import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Chat } from './entities/chat.entity';
import { Configuration, OpenAIApi } from 'openai';
export const importDynamic = new Function(
  'modulePath',
  'return import(modulePath)',
);
let conversationObj = {
  parentMessageId: null,
  conversationId: null,
};

let api = '';
let api1 = '';
let count = 0;
let count1 = 0;
let countTimeer = null;
let countTimeer1 = null;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private ChatRepository: Repository<Chat>,
  ) {}
  create(createChatDto: CreateChatDto) {
    return 'This action adds a new chat';
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: number) {
    return this.ChatRepository.findOne({
      where: { id: id },
    });
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }

  /**
   *
   * @param message 输入值
   * @returns 返回值
   */
  async chat(message: string) {
    const { ChatGPTAPI } = await importDynamic('chatgpt');
    const res = await this.findOne(1);
    clearInterval(countTimeer);
    countTimeer = setInterval(() => {
      count++;
      // 10分钟没有再次访问视为不再继续使用，计时器停止计时
      if (count >= 600) {
        clearInterval(countTimeer);
        count = 0;
      }
    }, 1000);
    const params = {
      apiKey: res.key,
      completionParams: {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        top_p: 0.8,
      },
    };
    if (count === 0) {
      // 初始访问 init
      api = new ChatGPTAPI(params);
    } else if (count > 0 && count <= 300) {
      // 5分钟间隔判断在话题时间内
      count = 1;
    } else {
      // 超出话题间隔时间，则重新计数，重新开始话题
      api = new ChatGPTAPI(params);
      count = 1;
    }
    const response = await this.generateResponse(api, message);

    return {
      code: 200,
      data: [
        {
          text: response,
        },
      ],
      message: '获取成功',
    };
    // const openai = new OpenAIApi(configuration);
    // try {
    //   const completion = await openai.createCompletion({
    //     prompt: message,
    //     model: 'text-davinci-003',
    //     temperature: 0.8,
    //     max_tokens: 1024,
    //     top_p: 1,
    //     frequency_penalty: 0.0,
    //     presence_penalty: 0.6,
    //     stop: ['Human:', 'AI:'],
    //   });
    //   console.log(completion.data.choices[0].text);
    //   return {
    //     code: 200,
    //     data: completion.data.choices,
    //     message: '获取数据成功',
    //   };
    // } catch (error) {
    //   if (error.response) {
    //     console.log(error.response.status);
    //     console.log(error.response.data);
    //   } else {
    //     console.log(error.message);
    //   }
    // }
    // const response = await openai11.listEngines();
  }

  // 处理用户输入并生成响应
  async generateResponse(api, input) {
    // 将id输入添加到上下文中
    console.log(api);
    try {
      const res = await api.sendMessage(input, {
        conversationId: conversationObj.conversationId,
        parentMessageId: conversationObj.parentMessageId,
      });
      conversationObj = {
        conversationId: res.conversationId,
        parentMessageId: res.id,
      };
      const text = res.text;

      // 返回生成的响应
      return text;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }

  async newChat(key, message, id) {
    const { ChatGPTAPI } = await importDynamic('chatgpt');
    clearInterval(countTimeer1);
    countTimeer1 = setInterval(() => {
      count1++;
      // 10分钟没有再次访问视为不再继续使用，计时器停止计时
      if (count >= 600) {
        clearInterval(countTimeer1);
        count1 = 0;
      }
    }, 1000);
    const params = {
      apiKey: key,
      completionParams: {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        top_p: 0.8,
      },
    };
    if (count1 === 0) {
      // 初始访问 init
      api1 = new ChatGPTAPI(params);
    } else if (count1 > 0 && count1 <= 300) {
      // 5分钟间隔判断在话题时间内
      count1 = 1;
    } else {
      // 超出话题间隔时间，则重新计数，重新开始话题
      api1 = new ChatGPTAPI(params);
      count1 = 1;
    }
    const response = await this.newGenerateResponse(api1, message, id);

    return {
      code: 200,
      data: response,
      message: '获取成功',
    };
  }

  // 处理用户输入并生成响应
  async newGenerateResponse(api, input, id) {
    // 将id输入添加到上下文中
    console.log(api);
    try {
      const res = await api.sendMessage(input, {
        parentMessageId: id,
      });
      // 返回生成的响应
      return {
        id: res.id,
        text: res.text,
      };
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }
}
