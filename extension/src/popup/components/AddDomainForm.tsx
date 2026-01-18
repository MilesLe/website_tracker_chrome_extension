import { useState, FormEvent } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';

interface AddDomainFormProps {
  onAddDomain: (domain: string, limit: string) => Promise<boolean>;
  error: string | null;
  onClearError: () => void;
}

const StyledFormContainer = styled(Box)`
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const StyledForm = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StyledButton = styled(Button)`
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
`;

/**
 * Form component for adding a new domain to track
 */
export default function AddDomainForm({ onAddDomain, error, onClearError }: AddDomainFormProps) {
  const [domainInput, setDomainInput] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await onAddDomain(domainInput, limitInput);
    
    if (success) {
      setDomainInput('');
      setLimitInput('');
    }
    
    setIsSubmitting(false);
  };

  const handleDomainChange = (value: string) => {
    setDomainInput(value);
    if (error) {
      onClearError();
    }
  };

  const handleLimitChange = (value: string) => {
    setLimitInput(value);
    if (error) {
      onClearError();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' && !isSubmitting) {
      callback();
    }
  };

  return (
    <StyledFormContainer>
      <Typography variant="h6" component="h2" sx={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>
        Add Domain
      </Typography>
      
      <StyledForm onSubmit={handleSubmit}>
        <TextField
          label="Domain (e.g., youtube.com)"
          placeholder="youtube.com"
          value={domainInput}
          onChange={(e) => handleDomainChange(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, () => handleSubmit(e as any))}
          fullWidth
          size="small"
          disabled={isSubmitting}
        />
        
        <TextField
          label="Daily Limit (minutes)"
          placeholder="60"
          type="number"
          value={limitInput}
          onChange={(e) => handleLimitChange(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, () => handleSubmit(e as any))}
          inputProps={{ min: 1 }}
          fullWidth
          size="small"
          disabled={isSubmitting}
        />
        
        {error && (
          <Alert severity="error" onClose={onClearError} sx={{ fontSize: '12px' }}>
            {error}
          </Alert>
        )}
        
        <StyledButton
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={isSubmitting}
        >
          Add Domain
        </StyledButton>
      </StyledForm>
    </StyledFormContainer>
  );
}
