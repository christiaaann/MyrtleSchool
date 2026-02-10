import React, { useState } from 'react';
import iconcall from '../assets/icons/call.png'
import icongmail from '../assets/icons/gmail.png'
const PreSchool = () => {

  const faqData = [
    {
      question: "What age is accepted for Preschool?",
      answer: "We accept children ages 3 to 5 years old, depending on the program level."
    },
    {
      question: "When does enrollment start?",
      answer: "Enrollment usually starts a few months before the opening of classes. Please check announcements for exact dates."
    },
    {
      question: "Is there an entrance exam?",
      answer: "No entrance exam is required for Preschool. Assessment is done through simple observation."
    },
    {
        question: "What do I need to prepare to enroll my child in Preschool?",
        answer: [
              "PSA Birth Certificate (photocopy)",
              "Photocopy of Progress Report Card",
              "2 pcs of 1x1 ID picture"
        ],
    
    }
  ];


  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    if (openIndex === index) {
      setOpenIndex(null); 
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <a className='font-bold text-neutral-700' href="/">Back</a>
      <div className='flex flex-col gap-2 w-full items-center'>
        <h1 className='border-2 border-black px-6 rounded-full'>FAQ</h1>
        <h1 className='font-semibold text-2xl text-neutral-500'>Frequently Asked Questions</h1>
      </div>

      <div className='mt-10 space-y-4'>
        {faqData.map((item, index) => (
          <div key={index} className='bg-gray-100 rounded-lg'>
            <button
              onClick={() => toggleFAQ(index)}
              className='w-full flex justify-between duration-300 items-center px-4 py-3 text-left text-lg font-medium focus:outline-none'
            >
              <span className='text-gray-700'>{item.question}</span>
              <span className='text-xl text-white bg-neutral-400 w-8 h-8 flex justify-center rounded-full'>{openIndex === index ? "−" : "+"}</span>
            </button>
           
            {openIndex === index && (
              <div className='px-4 pb-4 text-gray-500 flex flex-col gap-1'>
                {Array.isArray(item.answer)
                  ? item.answer.map((ans, idx) => <span key={idx}>• {ans}</span>)
                  : <span>{item.answer}</span>
                }
              </div>
            )}
          </div>
        ))}
      </div>
       
      <div className='mt-20'>
      <h1 className='text-2xl text-center font-semibold text-neutral-500'>You still have a question?</h1>
      <p className='text-neutral-500 mt-2 text-center flex flex-col'>If you cannot find answer to your question in our FAQ 
      <span>you can always contact us.We will answer to you shortly!</span>
      </p>  
       <div className='flex gap-5 items-center mt-8'>
         <div className='bg-gray-100 rounded-lg flex gap-2 flex-col items-center w-[28rem] p-2'>
          <img className='w-8' src={iconcall} alt="" />
          <h1 className='font-semibold text-neutral-700'>+0909090909</h1>
          <p className='text-neutral-500'>We are always happy fot help</p>
         </div>
          <div className='flex'>
         <div className='bg-gray-100 rounded-lg flex gap-2 flex-col items-center w-[28rem] p-2'>
          <img className='w-8' src={icongmail} alt="" />
          <h1 className='font-semibold text-neutral-700'>myrtle@gmail.com</h1>
          <p className='text-neutral-500'>The best way to get answer faster</p>
         </div>
       </div>
       </div>
       
      </div>
    </div>
  );
};

export default PreSchool;
