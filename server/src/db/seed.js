const pool = require('./connection');

// 廖雪峰 Python 教程章节数据
const chapters = [
  // 简介
  { title: '简介', url: '/books/python/introduction/index.html', sort_order: 1 },
  { title: 'Python的历史', url: '/books/python/history/index.html', sort_order: 2 },
  { title: 'Python安装', url: '/books/python/install/index.html', sort_order: 3 },
  { title: 'Python解释器', url: '/books/python/install/interpreter/index.html', sort_order: 4 },

  // 第一个程序
  { title: '第一个Python程序', url: '/books/python/first-program/index.html', sort_order: 10 },
  { title: '使用文本编辑器', url: '/books/python/first-program/text-editor/index.html', sort_order: 11 },
  { title: '输入和输出', url: '/books/python/first-program/input-output/index.html', sort_order: 12 },

  // 基本数据类型
  { title: '基本数据类型', url: '/books/python/basic/index.html', sort_order: 20 },
  { title: '字符串和编码', url: '/books/python/basic/string-encoding/index.html', sort_order: 21 },
  { title: 'list和tuple类型', url: '/books/python/basic/list-tuple/index.html', sort_order: 22 },
  { title: 'dict和set类型', url: '/books/python/basic/dict-set/index.html', sort_order: 23 },
  { title: '条件判断', url: '/books/python/basic/if/index.html', sort_order: 24 },
  { title: '循环', url: '/books/python/basic/loop/index.html', sort_order: 25 },
  { title: '模式匹配', url: '/books/python/basic/match/index.html', sort_order: 26 },

  // 函数
  { title: '函数', url: '/books/python/function/index.html', sort_order: 30 },
  { title: '定义函数', url: '/books/python/function/define-function/index.html', sort_order: 31 },
  { title: '函数的调用', url: '/books/python/function/call-function/index.html', sort_order: 32 },
  { title: '函数的参数', url: '/books/python/function/parameter/index.html', sort_order: 33 },
  { title: '递归函数', url: '/books/python/function/recursive-function/index.html', sort_order: 34 },

  // 面向对象编程
  { title: '面向对象编程', url: '/books/python/oop/index.html', sort_order: 40 },
  { title: '类和实例', url: '/books/python/oop/class/index.html', sort_order: 41 },
  { title: '访问限制', url: '/books/python/oop/access/index.html', sort_order: 42 },
  { title: '继承和多态', url: '/books/python/oop/extend/index.html', sort_order: 43 },
  { title: '获取对象信息', url: '/books/python/oop/attr/index.html', sort_order: 44 },
  { title: '实例属性和类属性', url: '/books/python/oop/props/index.html', sort_order: 45 },

  // 面向对象高级
  { title: '面向对象高级编程', url: '/books/python/oop-adv/index.html', sort_order: 50 },
  { title: '__slots__', url: '/books/python/oop-adv/slots/index.html', sort_order: 51 },
  { title: '@property', url: '/books/python/oop-adv/property/index.html', sort_order: 52 },
  { title: '多重继承', url: '/books/python/oop-adv/multi-inheritance/index.html', sort_order: 53 },
  { title: '定制类', url: '/books/python/oop-adv/special-method/index.html', sort_order: 54 },
  { title: '枚举类', url: '/books/python/oop-adv/enum/index.html', sort_order: 55 },
  { title: '元类', url: '/books/python/oop-adv/meta-class/index.html', sort_order: 56 },

  // 函数式编程
  { title: '函数式编程', url: '/books/python/functional/index.html', sort_order: 60 },
  { title: '高阶函数', url: '/books/python/functional/higher-order-function/index.html', sort_order: 61 },
  { title: 'map和reduce', url: '/books/python/functional/higher-order-function/map-reduce/index.html', sort_order: 62 },
  { title: 'filter', url: '/books/python/functional/higher-order-function/filter/index.html', sort_order: 63 },
  { title: 'sorted', url: '/books/python/functional/higher-order-function/sorted/index.html', sort_order: 64 },
  { title: '返回函数', url: '/books/python/functional/return-function/index.html', sort_order: 65 },
  { title: '匿名函数', url: '/books/python/functional/lambda/index.html', sort_order: 66 },
  { title: '装饰器', url: '/books/python/functional/decorator/index.html', sort_order: 67 },
  { title: '偏函数', url: '/books/python/functional/partial/index.html', sort_order: 68 },

  // 高级特性
  { title: '高级特性', url: '/books/python/advanced/index.html', sort_order: 70 },
  { title: '切片', url: '/books/python/advanced/slice/index.html', sort_order: 71 },
  { title: '迭代', url: '/books/python/advanced/iterate/index.html', sort_order: 72 },
  { title: '列表生成式', url: '/books/python/advanced/list-comprehension/index.html', sort_order: 73 },
  { title: '迭代器', url: '/books/python/advanced/iterator/index.html', sort_order: 74 },
  { title: '生成器', url: '/books/python/advanced/generator/index.html', sort_order: 75 },

  // 模块
  { title: '模块', url: '/books/python/module/index.html', sort_order: 80 },
  { title: '使用模块', url: '/books/python/module/use-module/index.html', sort_order: 81 },
  { title: '安装第三方模块', url: '/books/python/module/install/index.html', sort_order: 82 },

  // IO
  { title: 'IO编程', url: '/books/python/io/index.html', sort_order: 90 },
  { title: '文件读写', url: '/books/python/io/file/index.html', sort_order: 91 },
  { title: 'StringIO和BytesIO', url: '/books/python/io/stringio-bytesio/index.html', sort_order: 92 },
  { title: '操作文件和目录', url: '/books/python/io/dir/index.html', sort_order: 93 },
  { title: '序列化', url: '/books/python/io/serialization/index.html', sort_order: 94 },

  // 错误处理
  { title: '错误处理、调试和测试', url: '/books/python/error-debug-test/index.html', sort_order: 100 },
  { title: '错误处理', url: '/books/python/error-debug-test/error/index.html', sort_order: 101 },
  { title: '调试', url: '/books/python/error-debug-test/debug/index.html', sort_order: 102 },
  { title: '单元测试', url: '/books/python/error-debug-test/unit-test/index.html', sort_order: 103 },
  { title: '文档测试', url: '/books/python/error-debug-test/doctest/index.html', sort_order: 104 },

  // 数据库
  { title: '数据库编程', url: '/books/python/database/index.html', sort_order: 110 },
  { title: 'SQLite', url: '/books/python/database/sqlite/index.html', sort_order: 111 },
  { title: 'MySQL', url: '/books/python/database/mysql/index.html', sort_order: 112 },
  { title: 'SQLAlchemy', url: '/books/python/database/sqlalchemy/index.html', sort_order: 113 },

  // Web
  { title: 'Web开发', url: '/books/python/web/index.html', sort_order: 120 },
  { title: 'HTTP协议简介', url: '/books/python/web/http-basic/index.html', sort_order: 121 },
  { title: 'HTML简介', url: '/books/python/web/html-basic/index.html', sort_order: 122 },
  { title: 'WSGI接口', url: '/books/python/web/wsgi/index.html', sort_order: 123 },
  { title: 'Web框架', url: '/books/python/web/web-framework/index.html', sort_order: 124 },
  { title: '模板', url: '/books/python/web/template/index.html', sort_order: 125 },

  // 网络编程
  { title: '网络编程', url: '/books/python/network/index.html', sort_order: 130 },
  { title: 'TCP/IP简介', url: '/books/python/network/tcp-ip/index.html', sort_order: 131 },
  { title: 'TCP编程', url: '/books/python/network/tcp/index.html', sort_order: 132 },
  { title: 'UDP编程', url: '/books/python/network/udp/index.html', sort_order: 133 },

  // 多进程/多线程
  { title: '多进程和多线程', url: '/books/python/process-thread/index.html', sort_order: 140 },
  { title: '多进程', url: '/books/python/process-thread/process/index.html', sort_order: 141 },
  { title: '进程间通信', url: '/books/python/process-thread/process-manager/index.html', sort_order: 142 },
  { title: '多线程', url: '/books/python/process-thread/thread/index.html', sort_order: 143 },
  { title: 'ThreadLocal', url: '/books/python/process-thread/threadlocal/index.html', sort_order: 144 },
  { title: '进程vs线程', url: '/books/python/process-thread/process-vs-thread/index.html', sort_order: 145 },

  // 第三方模块
  { title: '常用第三方模块', url: '/books/python/third-party-modules/index.html', sort_order: 150 },
  { title: 'requests', url: '/books/python/third-party-modules/requests/index.html', sort_order: 151 },
  { title: 'chardet', url: '/books/python/third-party-modules/chardet/index.html', sort_order: 152 },
  { title: 'Pillow', url: '/books/python/third-party-modules/pillow/index.html', sort_order: 153 },
  { title: 'psutil', url: '/books/python/third-party-modules/psutil/index.html', sort_order: 154 },

  // 内置模块
  { title: '常用内置模块', url: '/books/python/built-in-modules/index.html', sort_order: 160 },
  { title: 'datetime', url: '/books/python/built-in-modules/datetime/index.html', sort_order: 161 },
  { title: 'collections', url: '/books/python/built-in-modules/collections/index.html', sort_order: 162 },
  { title: 'urllib', url: '/books/python/built-in-modules/urllib/index.html', sort_order: 163 },
  { title: 'hashlib', url: '/books/python/built-in-modules/hashlib/index.html', sort_order: 164 },
  { title: 'hmac', url: '/books/python/built-in-modules/hmac/index.html', sort_order: 165 },
  { title: 'struct', url: '/books/python/built-in-modules/struct/index.html', sort_order: 166 },
  { title: 'itertools', url: '/books/python/built-in-modules/itertools/index.html', sort_order: 167 },
  { title: 'xml', url: '/books/python/built-in-modules/xml/index.html', sort_order: 168 },
  { title: 'HTMLParser', url: '/books/python/built-in-modules/htmlparser/index.html', sort_order: 169 },
  { title: 'argparse', url: '/books/python/built-in-modules/argparse/index.html', sort_order: 170 },
  { title: 'venv', url: '/books/python/built-in-modules/venv/index.html', sort_order: 171 },
  { title: 'contextlib', url: '/books/python/built-in-modules/contextlib/index.html', sort_order: 172 },
  { title: 'base64', url: '/books/python/built-in-modules/base64/index.html', sort_order: 173 },

  // 异步IO
  { title: '异步IO', url: '/books/python/async-io/index.html', sort_order: 180 },
  { title: '协程', url: '/books/python/async-io/coroutine/index.html', sort_order: 181 },
  { title: 'asyncio', url: '/books/python/async-io/asyncio/index.html', sort_order: 182 },
  { title: 'aiohttp', url: '/books/python/async-io/aiohttp/index.html', sort_order: 183 },

  // GUI
  { title: 'GUI', url: '/books/python/gui/index.html', sort_order: 190 },
  { title: 'turtle', url: '/books/python/gui/turtle/index.html', sort_order: 191 },

  // Email
  { title: 'Email', url: '/books/python/email/index.html', sort_order: 200 },
  { title: 'SMTP发送邮件', url: '/books/python/email/smtp/index.html', sort_order: 201 },
  { title: 'POP3收取邮件', url: '/books/python/email/pop3/index.html', sort_order: 202 },

  // 正则表达式
  { title: '正则表达式', url: '/books/python/reg-exp/index.html', sort_order: 210 },

  // 常见问题
  { title: '常见问题', url: '/books/python/faq/index.html', sort_order: 220 },

  // 总结
  { title: '总结', url: '/books/python/conclusion/index.html', sort_order: 230 },
];

const BASE_URL = 'https://liaoxuefeng.com';

async function seed() {
  try {
    // 先创建表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tutorial_key VARCHAR(50) DEFAULT 'liaoxuefeng-python',
        title VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        chapter_id INT NOT NULL,
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_chapter (user_id, chapter_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        name VARCHAR(200) NOT NULL,
        type ENUM('file', 'folder') NOT NULL,
        content LONGTEXT,
        chapter_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        chapter_id INT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_chapter (user_id, chapter_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ 数据表创建完成');

    // 清空旧数据并插入章节
    await pool.query('DELETE FROM chapters WHERE tutorial_key = ?', ['liaoxuefeng-python']);

    for (const ch of chapters) {
      await pool.query(
        'INSERT INTO chapters (tutorial_key, title, url, sort_order) VALUES (?, ?, ?, ?)',
        ['liaoxuefeng-python', ch.title, BASE_URL + ch.url, ch.sort_order]
      );
    }

    console.log(`✅ 章节数据导入完成，共 ${chapters.length} 节`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed 失败:', err);
    process.exit(1);
  }
}

seed();
