import React from "react";

import { tw } from '../../../shared/utils/utils';
interface SMSButtonPhonePreviewProps {
  message: string;
  title?: string;
}

export function SMSButtonPhonePreview({
  message,
  title,
}: SMSButtonPhonePreviewProps) {
  return (
    <div className={`flex justify-center items-center p-8 bg-gray-100 ${tw.rounded}`}>
      <div className="relative">
        {/* Feature Phone Mockup */}
        <div className="w-64 h-[500px] bg-blue-600 rounded-[2.5rem] p-3 shadow-2xl">
          {/* Phone Screen */}
          <div className="w-full h-full bg-black rounded-[2rem] p-4 flex flex-col">
            {/* Phone Header */}
            <div className={` text-center mb-2`}>
              <div className="text-xs font-semibold">PHONE</div>
            </div>

            {/* Message Display Area */}
            <div className={`flex-1 bg-gray-900 ${tw.rounded} p-4 overflow-y-auto`}>
              <div className="space-y-3">
                {/* Date Label */}
                <div className="text-center text-gray-500 text-xs mb-2">
                  Today
                </div>

                {/* Message Bubble */}
                <div className="flex justify-start">
                  <div className={`bg-gray-700 text-white ${tw.rounded} rounded-tl-md px-4 py-2 max-w-[85%]`}>
                    <div className="text-xs font-semibold mb-1">Equitel</div>
                    {title && (
                      <div className="font-semibold text-sm mb-1">{title}</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message || "No message content"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Button */}
            <div className="mt-2 flex justify-center">
              <button className={`bg-blue-600  text-xs px-6 py-2 rounded`}>
                Reply
              </button>
            </div>

            {/* Keypad Area (visual only) */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
                <div
                  key={key}
                  className={`${tw.surfaceSecondary}00  text-xs font-semibold rounded py-2 text-center`}
                >
                  {key}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SMSSmartphonePreviewProps {
  message: string;
  title?: string;
}

export function SMSSmartphonePreview({
  message,
  title,
}: SMSSmartphonePreviewProps) {
  return (
    <div className={`flex justify-center items-center p-8 bg-gray-100 ${tw.rounded}`}>
      <div className="relative">
        {/* Smartphone Mockup */}
        <div className="w-72 h-[600px] bg-gray-800 rounded-[3rem] p-2 shadow-2xl">
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-xs text-gray-600">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className={`w-4 h-2 border border-gray-600 ${tw.rounded}`}>
                  <div className={`w-3/4 h-full bg-gray-600 ${tw.rounded}`}></div>
                </div>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>

            {/* SMS Header */}
            <div className={`bg-blue-500  px-4 py-3 flex items-center gap-3 border-b border-blue-600`}>
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-lg font-semibold">
                {title?.[0]?.toUpperCase() || "E"}
              </div>
              <div>
                <div className="font-semibold">{title || "Sender"}</div>
              </div>
            </div>

            {/* SMS Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              <div className="space-y-3">
                {/* Date Label */}
                <div className="text-center text-gray-500 text-xs mb-4">
                  Today
                </div>

                {/* SMS Message Bubble (from sender - left side) */}
                <div className="flex justify-start">
                  <div className={`bg-gray-200 text-gray-900 ${tw.rounded} rounded-tl-md px-4 py-2 max-w-[80%] shadow-sm`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message || "No message content"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmailLaptopPreviewProps {
  title?: string;
  htmlBody?: string;
  textBody?: string;
}

export function EmailLaptopPreview({
  title,
  htmlBody,
  textBody,
}: EmailLaptopPreviewProps) {
  return (
    <div className={`flex justify-center items-center p-8 bg-gray-100 ${tw.rounded}`}>
      <div className="relative">
        {/* Laptop Mockup */}
        <div className="w-[800px]">
          {/* Laptop Screen */}
          <div className="bg-gray-800 rounded-t-md p-1">
            <div className="bg-white rounded-t-md overflow-hidden">
              {/* Browser Bar */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className={`flex-1 bg-white ${tw.rounded} px-3 py-1 text-xs text-gray-600 border border-gray-300 ml-4`}>
                  mail.example.com
                </div>
              </div>

              {/* Email Content */}
              <div className="bg-white min-h-[400px]">
                {/* Email Header */}
                <div className="border-b border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center  font-semibold`}>
                      {title?.[0]?.toUpperCase() || "E"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {title || "Email Subject"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        From: sender@example.com • To: recipient@example.com
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6">
                  {htmlBody ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: htmlBody }}
                    />
                  ) : textBody ? (
                    <div className="whitespace-pre-wrap text-gray-900">
                      {textBody}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No email content to preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Base */}
          <div className="bg-gray-800 h-2 rounded-b-md"></div>
          <div className="bg-gray-700 h-1 rounded-b-md mx-auto w-3/4"></div>
        </div>
      </div>
    </div>
  );
}
