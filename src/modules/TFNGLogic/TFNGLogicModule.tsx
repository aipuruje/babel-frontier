import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './TFNGLogic.css';

interface TFNGLogicModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function TFNGLogicModule({ activeTab }: TFNGLogicModuleProps) {
    return (
        <div className="tfng-logic-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
