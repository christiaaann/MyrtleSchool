import React from "react";
import UploadBox from "../../components/UploadBox"; 

const UploadRequirements = ({ files, setFiles, errors, studentType }) => {

  return (
    <section className="space-y-6">
     
     {/* 2x2 ID Picture */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-sm">
          2x2 ID Picture <span className="text-red-600">*</span>
        </label>
        <UploadBox
          file={files.idPicture}
          setFile={(file) => setFiles(prev => ({ ...prev, idPicture: file }))}
        />
        {errors.idPicture && <p className="text-red-500 text-xs">{errors.idPicture}</p>}
      </div>

      
      {/* Birth Certificate */}
      <div className="flex gap-2">
      <div className="flex flex-col w-full gap-2">
        <label className="font-semibold text-sm">
          Birth Certificate <span className="text-red-600">*</span>
        </label>
        <UploadBox
          file={files.birthCert}
          setFile={(file) => setFiles(prev => ({ ...prev, birthCert: file }))}
        />
        {errors.birthCert && <p className="text-red-500 text-xs">{errors.birthCert}</p>}
      </div>
        {/* Report Card */}
        <div className=" w-full">
        <label className="font-semibold text-sm">
            Report Card <span className="text-red-600">*</span>
        </label>
        <UploadBox
            file={files.reportCard}
            setFile={(file) => setFiles(prev => ({ ...prev, reportCard: file }))}
        />
        {errors.reportCard && <p className="text-red-500 text-xs">{errors.reportCard}</p>}
        </div>
        </div>
    </section>
  );
};

export default UploadRequirements;