import { WritingTemplate, WritingGenre } from '@/types/writing';

export const WRITING_TEMPLATES: WritingTemplate[] = [
  // ESSAYS
  {
    id: 'essay-argumentative',
    title: 'Argumentative Essay',
    description: 'Present and support an argument with evidence',
    genre: 'essay',
    structure: {
      sections: [
        {
          title: 'Introduction',
          description: 'Hook your readers and state your thesis clearly.',
          placeholder: 'Start with an attention-grabbing hook, provide some background on your topic, and end with a clear thesis statement that presents your argument.'
        },
        {
          title: 'Body Paragraph 1',
          description: 'Present your first main point with supporting evidence.',
          placeholder: 'Start with a topic sentence that supports your thesis. Then provide evidence, examples, or data that support this point. Explain how this evidence relates to your thesis.'
        },
        {
          title: 'Body Paragraph 2',
          description: 'Present your second main point with supporting evidence.',
          placeholder: 'Start with a topic sentence that supports your thesis. Then provide evidence, examples, or data that support this point. Explain how this evidence relates to your thesis.'
        },
        {
          title: 'Body Paragraph 3',
          description: 'Present your third main point with supporting evidence.',
          placeholder: 'Start with a topic sentence that supports your thesis. Then provide evidence, examples, or data that support this point. Explain how this evidence relates to your thesis.'
        },
        {
          title: 'Counterargument',
          description: 'Address opposing viewpoints to strengthen your position.',
          placeholder: 'Present a counterargument to your thesis. Then refute it by showing why it is flawed or why your argument is stronger.'
        },
        {
          title: 'Conclusion',
          description: 'Summarize your main points and restate your thesis.',
          placeholder: 'Restate your thesis in different words. Summarize your main points and leave your readers with a final thought or call to action.'
        }
      ]
    },
    exampleTopics: [
      'Should social media be regulated more strictly?',
      'Is climate change the most urgent problem of our time?',
      'Should schools eliminate homework?',
      'Are e-books better than printed books?',
      'Should junk food be banned in schools?'
    ],
    recommendedWordCount: 800,
    difficulty: 2
  },
  
  {
    id: 'essay-expository',
    title: 'Expository Essay',
    description: 'Explain a topic or process clearly and informatively',
    genre: 'essay',
    structure: {
      sections: [
        {
          title: 'Introduction',
          description: 'Introduce your topic and provide a clear thesis statement.',
          placeholder: 'Start with a brief definition or overview of your topic. Provide context for why this topic is important or interesting. End with a clear thesis statement that outlines what you will explain.'
        },
        {
          title: 'Background',
          description: 'Provide necessary background information on your topic.',
          placeholder: 'Give readers the background information they need to understand your explanation. Define any key terms or concepts. Provide historical context if relevant.'
        },
        {
          title: 'First Key Point',
          description: 'Explain the first major aspect of your topic.',
          placeholder: 'Present your first key point or step in the process. Provide clear details, examples, or evidence. Explain how this relates to your overall topic.'
        },
        {
          title: 'Second Key Point',
          description: 'Explain the second major aspect of your topic.',
          placeholder: 'Present your second key point or step in the process. Provide clear details, examples, or evidence. Explain how this connects to your previous point.'
        },
        {
          title: 'Third Key Point',
          description: 'Explain the third major aspect of your topic.',
          placeholder: 'Present your third key point or step in the process. Provide clear details, examples, or evidence. Explain how this connects to your previous points.'
        },
        {
          title: 'Conclusion',
          description: 'Summarize your explanation and its significance.',
          placeholder: 'Summarize the main points of your explanation. Restate why this topic is important or relevant. Consider the implications or applications of what you\'ve explained.'
        }
      ]
    },
    exampleTopics: [
      'How do vaccines work?',
      'The process of photosynthesis',
      'How social media algorithms influence what we see',
      'The water cycle explained',
      'How electric cars function'
    ],
    recommendedWordCount: 700,
    difficulty: 1
  },
  
  // STORIES
  {
    id: 'story-narrative',
    title: 'Personal Narrative',
    description: 'Tell a compelling story from your own experience',
    genre: 'story',
    structure: {
      sections: [
        {
          title: 'Hook',
          description: 'Start with a compelling hook to draw readers in.',
          placeholder: 'Begin with a surprising statement, vivid description, or intriguing question that will make readers want to continue. Set the scene for your story.'
        },
        {
          title: 'Context',
          description: 'Provide background information for your story.',
          placeholder: 'Give readers the context they need to understand your story. Introduce the setting, time period, and any important background information.'
        },
        {
          title: 'Rising Action',
          description: 'Build tension through a series of events.',
          placeholder: 'Describe the events that lead up to the main conflict or challenge in your story. Show how tension or stakes increase as the story progresses.'
        },
        {
          title: 'Climax',
          description: 'Present the most intense or important moment.',
          placeholder: 'Describe the turning point or moment of greatest tension in your story. This is often the moment where the main conflict comes to a head.'
        },
        {
          title: 'Falling Action',
          description: 'Show the results of the climax.',
          placeholder: 'Describe what happens as a result of the climax. Show how the main conflict begins to resolve.'
        },
        {
          title: 'Resolution',
          description: 'Conclude your story and share what you learned.',
          placeholder: 'Wrap up your story by showing how things turned out. More importantly, reflect on what this experience taught you or how it changed you.'
        }
      ]
    },
    exampleTopics: [
      'A time when you overcame a fear',
      'An unexpected friendship',
      'A moment that changed your perspective',
      'A challenge you faced and how you overcame it',
      'An important lesson you learned the hard way'
    ],
    recommendedWordCount: 900,
    difficulty: 2
  },
  
  {
    id: 'story-fiction',
    title: 'Short Fiction',
    description: 'Create a fictional story with characters and plot',
    genre: 'story',
    structure: {
      sections: [
        {
          title: 'Opening',
          description: 'Introduce your main character and setting.',
          placeholder: 'Begin by introducing your main character in an interesting situation. Establish the setting (time and place) and give readers a sense of your character\'s normal world.'
        },
        {
          title: 'Inciting Incident',
          description: 'Present the event that sets the story in motion.',
          placeholder: 'Describe the event or situation that disrupts your character\'s normal world and sets the main conflict in motion. This should give your character a goal or problem to solve.'
        },
        {
          title: 'Rising Action',
          description: 'Show your character taking steps toward their goal.',
          placeholder: 'Describe your character\'s attempts to achieve their goal or solve their problem. Include obstacles and complications that make things more difficult.'
        },
        {
          title: 'Climax',
          description: 'Present the turning point of your story.',
          placeholder: 'Describe the crucial moment where your character faces their biggest challenge. This is often the moment where they must make an important choice or take a significant risk.'
        },
        {
          title: 'Falling Action',
          description: 'Show the immediate results of the climax.',
          placeholder: 'Describe what happens as a direct result of the climax. Show how the main conflict begins to resolve, for better or worse.'
        },
        {
          title: 'Resolution',
          description: 'Show how things turn out and what changed.',
          placeholder: 'Wrap up your story by showing the final outcome. Show how your character has changed or what they\'ve learned. Leave readers with a satisfying conclusion.'
        }
      ]
    },
    exampleTopics: [
      'A character who discovers an unusual ability',
      'An encounter with a mysterious stranger',
      'A journey to an unexpected destination',
      'A character facing an impossible choice',
      'A day where everything goes wrong'
    ],
    recommendedWordCount: 1200,
    difficulty: 3
  },
  
  // JOURNALISM
  {
    id: 'journalism-news',
    title: 'News Article',
    description: 'Report on a current event in a clear, objective manner',
    genre: 'journalism',
    structure: {
      sections: [
        {
          title: 'Headline',
          description: 'Create a clear, informative title for your article.',
          placeholder: 'Write a headline that concisely summarizes the main point of your story. Avoid clickbait or sensationalism.'
        },
        {
          title: 'Lead/Introduction',
          description: 'Summarize the essential facts of your story.',
          placeholder: 'Answer the key questions: Who? What? When? Where? Why? How? Provide the most important information in the first paragraph.'
        },
        {
          title: 'Background',
          description: 'Provide context for your story.',
          placeholder: 'Give readers the background information they need to understand the significance of the event. Include relevant history or previous related events.'
        },
        {
          title: 'Main Facts',
          description: 'Present the key details of the event.',
          placeholder: 'Describe what happened in more detail, using clear and objective language. Organize information from most to least important.'
        },
        {
          title: 'Quotes/Perspectives',
          description: 'Include relevant quotes from involved parties.',
          placeholder: 'Include direct quotes from people involved in or affected by the event. Try to represent different perspectives for balance.'
        },
        {
          title: 'Conclusion',
          description: 'Wrap up with future implications or next steps.',
          placeholder: 'Conclude with information about what might happen next or the broader implications of this event. Avoid editorializing or offering your own opinion.'
        }
      ]
    },
    exampleTopics: [
      'Local school implements new technology program',
      'Community garden opens in neighborhood park',
      'Student wins national science competition',
      'New recycling initiative launches in town',
      'Local team advances to state championships'
    ],
    recommendedWordCount: 500,
    difficulty: 2
  },
  
  // POETRY
  {
    id: 'poetry-free-verse',
    title: 'Free Verse Poetry',
    description: 'Express yourself through non-rhyming poetry with vivid imagery',
    genre: 'poetry',
    structure: {
      sections: [
        {
          title: 'Title',
          description: 'Create an evocative title for your poem.',
          placeholder: 'Choose a title that captures the essence of your poem or creates intrigue.'
        },
        {
          title: 'Opening Lines',
          description: 'Begin with strong imagery or an intriguing idea.',
          placeholder: 'Start with vivid imagery or a powerful statement that immediately engages the reader and establishes the tone of your poem.'
        },
        {
          title: 'Development',
          description: 'Expand on your central theme or image.',
          placeholder: 'Develop your central theme or image with specific details, metaphors, or sensory language. Build on the ideas introduced in your opening.'
        },
        {
          title: 'Turn',
          description: 'Introduce a shift in perspective or tone.',
          placeholder: 'Create a pivot or turn in your poem where something changes—a realization, a shift in perspective, or a deepening of the initial idea.'
        },
        {
          title: 'Conclusion',
          description: 'End with a memorable or thought-provoking final image.',
          placeholder: 'Conclude with a strong image or statement that resonates with the reader and provides a sense of closure or opens up a new question.'
        }
      ]
    },
    exampleTopics: [
      'A memory that haunts you',
      'The changing seasons',
      'A significant object from your childhood',
      'An emotion that\'s hard to describe',
      'A place that feels like home'
    ],
    recommendedWordCount: 150,
    difficulty: 2
  },
  
  // LETTERS
  {
    id: 'letter-persuasive',
    title: 'Persuasive Letter',
    description: 'Write a formal letter to convince someone of your position',
    genre: 'letter',
    structure: {
      sections: [
        {
          title: 'Sender/Recipient Information',
          description: 'Include your address and the recipient\'s address.',
          placeholder: 'Your Name\nYour Address\nCity, State ZIP\n\nDate\n\nRecipient\'s Name\nRecipient\'s Title\nOrganization\nAddress\nCity, State ZIP'
        },
        {
          title: 'Greeting',
          description: 'Address the recipient formally.',
          placeholder: 'Dear [Recipient\'s Name/Title],\n\n'
        },
        {
          title: 'Introduction',
          description: 'State your purpose and main request/position.',
          placeholder: 'Introduce yourself if necessary. Clearly state the purpose of your letter and your main request or position. Briefly preview your key reasons or arguments.'
        },
        {
          title: 'Body',
          description: 'Present your arguments with supporting evidence.',
          placeholder: 'Present your strongest arguments and supporting evidence. Use specific examples, data, or personal experiences to make your case. Address potential counterarguments respectfully. Use clear, formal language throughout.'
        },
        {
          title: 'Request/Action',
          description: 'Clearly state what you want the recipient to do.',
          placeholder: 'Clearly state the specific action you want the recipient to take. Make it as easy as possible for them to respond positively by being specific and reasonable in your request.'
        },
        {
          title: 'Conclusion',
          description: 'Thank the recipient and provide contact information.',
          placeholder: 'Thank the recipient for their time and consideration. Express confidence in a positive outcome. Provide your contact information and indicate your willingness to provide additional information if needed.'
        },
        {
          title: 'Closing',
          description: 'End with a formal closing and your name.',
          placeholder: 'Sincerely,\n\n[Your Name]\n[Your Title/Position, if relevant]'
        }
      ]
    },
    exampleTopics: [
      'Request for your school to add a new program or club',
      'Letter to local government about a community issue',
      'Request for a company to change an environmentally harmful practice',
      'Letter to the editor about an important local issue',
      'Appeal of a decision or policy that affects you'
    ],
    recommendedWordCount: 400,
    difficulty: 2
  },
  
  // SPEECH
  {
    id: 'speech-informative',
    title: 'Informative Speech',
    description: 'Educate your audience about a topic in an engaging way',
    genre: 'speech',
    structure: {
      sections: [
        {
          title: 'Attention-Grabber',
          description: 'Begin with something that will capture audience attention.',
          placeholder: 'Start with a startling statistic, a powerful quote, a thought-provoking question, or a brief story that relates to your topic and will immediately engage your audience.'
        },
        {
          title: 'Introduction',
          description: 'Introduce yourself and your topic.',
          placeholder: 'Briefly introduce yourself if necessary. Clearly state what your speech is about and why it matters to your audience. Preview the main points you\'ll cover to help your audience follow along.'
        },
        {
          title: 'Main Point 1',
          description: 'Present your first key piece of information.',
          placeholder: 'Present your first main point with supporting details, examples, or evidence. Use clear language and explain any technical terms. Connect this point to your overall topic.'
        },
        {
          title: 'Main Point 2',
          description: 'Present your second key piece of information.',
          placeholder: 'Present your second main point with supporting details, examples, or evidence. Create a smooth transition from your previous point. Maintain a conversational but informative tone.'
        },
        {
          title: 'Main Point 3',
          description: 'Present your third key piece of information.',
          placeholder: 'Present your third main point with supporting details, examples, or evidence. Create a smooth transition from your previous point. Consider using a visual aid or demonstration here if appropriate.'
        },
        {
          title: 'Conclusion',
          description: 'Summarize and leave a lasting impression.',
          placeholder: 'Summarize your main points. Emphasize why this information matters. End with a memorable statement or call to action that will resonate with your audience after you finish speaking.'
        }
      ]
    },
    exampleTopics: [
      'How a particular technology works',
      'The history of an important event or movement',
      'An explanation of a scientific concept',
      'How to do something (a process or skill)',
      'The importance of a specific issue'
    ],
    recommendedWordCount: 600,
    difficulty: 2
  }
];